"""
The Gemini provider against a fake Gemini server, over real HTTP.

The other Gemini tests stub the SDK's call site, which proves what this service
does with an answer but not that the request it builds is one Google would
accept. These run the SDK's real serialisation through an `httpx` transport and
assert on the bytes that would have gone out — the model in the path, the roles,
the system instruction, the JSON schema, the image as inline data — and then let
the SDK parse a real response envelope back.

That is as close to end-to-end as this suite gets without a live key, and it is
the layer where a mistake would otherwise only show up in production.
"""

import json

import httpx
import pytest
from google.genai import types

from app.config import Settings
from app.providers.gemini_provider import GeminiProvider
from app.schemas import ChatTurn, RuleSummary

ANALYSIS = {
    "verdict": "likely_scam",
    "risk_score": 92,
    "confidence": 0.88,
    "scam_type": "toll_or_fine",
    "tactics": [{"tactic": "False urgency", "evidence": "pay within 12 hours", "explanation": "Real tolls do not do this."}],
    "sentiment": {"overall": "negative", "pressure_level": "high", "emotions": [{"emotion": "urgency", "intensity": 0.9}]},
    "explanation": "This is a toll scam.",
    "genuine_signals": [],
    "recommended_actions": ["Do not click the link.", "Delete the message."],
}

IMAGE_ANALYSIS = {
    "image_type": "sms_screenshot",
    "description": "A text message claiming an unpaid toll.",
    "visible_text_summary": "Unpaid toll, pay now.",
    "brands_detected": [{"name": "Linkt", "context": "sender name"}],
    "visual_red_flags": [{"flag": "Lookalike domain", "explanation": "linkt-pay.example.com is not Linkt."}],
    "verdict": "likely_scam",
    "risk_score": 88,
    "confidence": 0.8,
    "explanation": "A lookalike toll page.",
    "recommended_actions": ["Do not enter card details."],
}

# A 1x1 PNG, as the browser would send it after re-encoding.
PNG_DATA_URL = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlE"
    "QVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def fake_gemini(reply_text: str, *, status: int = 200):
    """A stand-in for generativelanguage.googleapis.com that records what it was sent."""
    sent: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        sent.append(request)

        if status != 200:
            return httpx.Response(status, json={"error": {"code": status, "status": "INVALID_ARGUMENT", "message": "no"}})

        return httpx.Response(
            200,
            json={
                "candidates": [
                    {"content": {"role": "model", "parts": [{"text": reply_text}]}, "finishReason": "STOP"}
                ],
                "usageMetadata": {"promptTokenCount": 120, "candidatesTokenCount": 310},
                "modelVersion": "gemini-3.5-flash-001",
            },
        )

    return handler, sent


def provider_talking_to(handler) -> GeminiProvider:
    provider = GeminiProvider(
        Settings(AI_PROVIDER="gemini", GEMINI_API_KEY="fake-key", GEMINI_MODEL="gemini-3.5-flash")
    )
    # Rebuilt with the fake transport in place of the network.
    from google import genai

    provider._client = genai.Client(
        api_key="fake-key",
        http_options=types.HttpOptions(client_args={"transport": httpx.MockTransport(handler)}),
    )
    return provider


def body_of(request: httpx.Request) -> dict:
    return json.loads(request.content)


# ── text analysis ───────────────────────────────────────────────────────────


def test_a_text_analysis_goes_out_as_a_request_google_would_accept():
    handler, sent = fake_gemini(json.dumps(ANALYSIS))
    provider = provider_talking_to(handler)

    response = provider.analyse_text("Unpaid toll — pay within 12 hours", "sms", None)

    assert len(sent) == 1
    request = sent[0]
    assert "models/gemini-3.5-flash:generateContent" in str(request.url)

    body = body_of(request)
    assert body["contents"][0]["role"] == "user"
    assert "Unpaid toll" in body["contents"][0]["parts"][0]["text"]
    assert "CyberKent" in body["systemInstruction"]["parts"][0]["text"]

    generation = body["generationConfig"]
    assert generation["responseMimeType"] == "application/json"
    assert generation["responseSchema"]["properties"]["risk_score"]["type"].lower() == "integer"
    assert generation["maxOutputTokens"] >= 4_000, "the ceiling must leave room for thinking as well as the answer"

    # And the answer comes back through the real parser.
    assert response.result.verdict == "likely_scam"
    assert response.result.tactics[0].tactic == "False urgency"
    assert response.usage.provider == "gemini"
    assert response.usage.model == "gemini-3.5-flash-001"
    assert response.usage.input_tokens == 120 and response.usage.output_tokens == 310


def test_the_rule_engines_view_travels_with_the_message():
    handler, sent = fake_gemini(json.dumps(ANALYSIS))
    provider = provider_talking_to(handler)

    provider.analyse_text(
        "Unpaid toll",
        "sms",
        rules=RuleSummary(score=80, band="high", indicators=["Urgency", "Lookalike domain"]),
    )

    prompt = body_of(sent[0])["contents"][0]["parts"][0]["text"]
    assert "80/100" in prompt and "Lookalike domain" in prompt


def test_the_api_key_travels_in_a_header_and_never_in_the_url():
    handler, sent = fake_gemini(json.dumps(ANALYSIS))
    provider = provider_talking_to(handler)

    provider.analyse_text("hello there", "sms", None)

    assert "fake-key" not in str(sent[0].url), "a key in a URL is a key in every access log"
    assert sent[0].headers.get("x-goog-api-key") == "fake-key"


# ── image analysis ──────────────────────────────────────────────────────────


def test_an_image_goes_out_as_inline_data_beside_its_prompt():
    handler, sent = fake_gemini(json.dumps(IMAGE_ANALYSIS))
    provider = provider_talking_to(handler)

    response = provider.analyse_image(PNG_DATA_URL, "my sister got this too")

    parts = body_of(sent[0])["contents"][0]["parts"]
    assert "my sister got this too" in parts[0]["text"]
    assert parts[1]["inlineData"]["mimeType"] == "image/png"
    assert parts[1]["inlineData"]["data"], "the bytes are sent, not the data: URL"
    assert "data:image" not in json.dumps(parts), "the data URL wrapper never goes to the provider"

    assert response.result.image_type == "sms_screenshot"
    assert response.result.brands_detected[0].name == "Linkt"


# ── the assistant ───────────────────────────────────────────────────────────


def test_a_conversation_goes_out_with_geminis_role_names_and_the_system_prompt():
    handler, sent = fake_gemini("Do not pay it. Report it to Council.")
    provider = provider_talking_to(handler)

    reply = provider.chat([
        ChatTurn(role="user", content="I got a toll text"),
        ChatTurn(role="assistant", content="Do not pay it."),
        ChatTurn(role="user", content="What should I do now?"),
    ])

    body = body_of(sent[0])
    assert [turn["role"] for turn in body["contents"]] == ["user", "model", "user"]
    assert "CyberSafe Assistant" in body["systemInstruction"]["parts"][0]["text"]
    # No JSON schema on this path: the assistant answers in prose.
    assert "responseSchema" not in body["generationConfig"]

    assert reply.reply == "Do not pay it. Report it to Council."
    assert reply.blocked is False
    assert reply.usage.provider == "gemini"


def test_the_service_retries_once_over_real_http_and_then_gives_up(monkeypatch):
    monkeypatch.setattr("time.sleep", lambda _: None)
    attempts: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        attempts.append(request)
        return httpx.Response(503, json={"error": {"code": 503, "status": "UNAVAILABLE", "message": "overloaded"}})

    provider = provider_talking_to(handler)

    with pytest.raises(Exception, match="unavailable"):
        provider.analyse_text("hello there", "sms", None)

    assert len(attempts) == 2, "one retry, not the SDK's five"
