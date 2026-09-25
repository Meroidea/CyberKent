"""
The Gemini provider, tested without the network by routing its HTTP client
through an `httpx.MockTransport` that plays the part of the Gemini API.
"""

import json

import httpx
import pytest

from app.config import Settings
from app.providers.base import ProviderRefused, ProviderUnavailable
from app.providers.gemini_provider import API_ROOT, GeminiProvider
from app.providers.replies import CRISIS_REPLY, REFUSAL_REPLY
from app.schemas import ChatTurn, RuleSummary

ANALYSIS = {
    "verdict": "likely_scam",
    "risk_score": 140,
    "confidence": 0.9,
    "scam_type": "toll_or_fine",
    "tactics": [{"tactic": "False urgency", "evidence": "Pay within 24 hours", "explanation": "Pressure to act fast."}],
    "sentiment": {"overall": "negative", "pressure_level": "high", "emotions": [{"emotion": "fear", "intensity": 1.4}]},
    "explanation": "This is a toll scam.",
    "genuine_signals": [],
    "recommended_actions": ["Do not tap the link.", "Check your account at linkt.com.au."],
}


def answer(text: str, finish: str = "STOP") -> dict:
    return {
        "candidates": [{"content": {"role": "model", "parts": [{"text": text}]}, "finishReason": finish}],
        "usageMetadata": {"promptTokenCount": 120, "candidatesTokenCount": 80, "thoughtsTokenCount": 40},
        "modelVersion": "gemini-2.5-flash",
    }


@pytest.fixture()
def gemini(monkeypatch):
    monkeypatch.setattr("time.sleep", lambda _: None)
    provider = GeminiProvider(Settings(GEMINI_API_KEY="test-key"))
    requests: list[httpx.Request] = []
    replies: list[httpx.Response] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return replies.pop(0)

    provider._client = httpx.Client(base_url=API_ROOT, transport=httpx.MockTransport(handler), headers={"x-goog-api-key": "test-key"})
    provider.requests = requests
    provider.replies = replies
    return provider


def test_configured_only_when_its_key_is_set():
    assert Settings(GEMINI_API_KEY="k").configured is True
    assert Settings(GEMINI_API_KEY="").configured is False


def test_text_analysis_sends_a_self_contained_schema_and_clamps_the_answer(gemini):
    gemini.replies.append(httpx.Response(200, json=answer(json.dumps(ANALYSIS))))

    response = gemini.analyse_text("Pay within 24 hours", "sms", RuleSummary(score=80, band="high"))

    body = json.loads(gemini.requests[0].content)
    schema = body["generationConfig"]["responseJsonSchema"]
    assert "$ref" not in json.dumps(schema) and "$defs" not in schema
    assert body["generationConfig"]["responseMimeType"] == "application/json"
    assert gemini.requests[0].url.path.endswith("/models/gemini-2.5-flash:generateContent")
    assert gemini.requests[0].headers["x-goog-api-key"] == "test-key"

    assert response.result.risk_score == 100
    assert response.result.sentiment.emotions[0].intensity == 1.0
    assert response.usage.input_tokens == 120 and response.usage.output_tokens == 120


def test_an_answer_that_does_not_match_the_schema_is_a_refusal(gemini):
    gemini.replies.append(httpx.Response(200, json=answer('{"verdict": "maybe"}')))
    with pytest.raises(ProviderRefused):
        gemini.analyse_text("hello", "sms", None)


def test_a_cut_off_answer_is_a_refusal(gemini):
    gemini.replies.append(httpx.Response(200, json=answer('{"verdict":', finish="MAX_TOKENS")))
    with pytest.raises(ProviderRefused):
        gemini.analyse_text("hello", "sms", None)


def test_exhausted_quota_is_retried_once_then_pauses_ai(gemini):
    gemini.replies.extend([httpx.Response(429, json={"error": {"status": "RESOURCE_EXHAUSTED"}})] * 2)

    with pytest.raises(ProviderUnavailable):
        gemini.analyse_text("hello", "sms", None)

    assert len(gemini.requests) == 2
    assert gemini.configured is False
    with pytest.raises(ProviderUnavailable):
        gemini.analyse_text("hello", "sms", None)
    assert len(gemini.requests) == 2


def test_an_invalid_key_is_unavailable_without_a_retry(gemini):
    gemini.replies.append(httpx.Response(400, json={"error": {"status": "INVALID_ARGUMENT"}}))
    with pytest.raises(ProviderUnavailable):
        gemini.analyse_text("hello", "sms", None)
    assert len(gemini.requests) == 1


def test_image_is_sent_inline(gemini):
    image = {
        "image_type": "sms_screenshot",
        "description": "A text message.",
        "visible_text_summary": "Unpaid toll.",
        "brands_detected": [{"name": "Linkt", "context": "sender name"}],
        "visual_red_flags": [],
        "verdict": "likely_scam",
        "risk_score": 90,
        "confidence": 0.8,
        "explanation": "Toll scam.",
        "recommended_actions": ["Delete it."],
    }
    gemini.replies.append(httpx.Response(200, json=answer(json.dumps(image))))

    gemini.analyse_image("data:image/png;base64,iVBORw0KGgo=", "from a text")

    part = json.loads(gemini.requests[0].content)["contents"][0]["parts"][1]
    assert part == {"inlineData": {"mimeType": "image/png", "data": "iVBORw0KGgo="}}


def test_chat_maps_roles_and_returns_the_reply(gemini):
    gemini.replies.append(httpx.Response(200, json=answer("Call your bank on the number on your card.")))

    reply = gemini.chat([ChatTurn(role="user", content="hi"), ChatTurn(role="assistant", content="hello"), ChatTurn(role="user", content="I paid a scammer")])

    roles = [turn["role"] for turn in json.loads(gemini.requests[0].content)["contents"]]
    assert roles == ["user", "model", "user"]
    assert reply.reply.startswith("Call your bank") and reply.blocked is False


def test_a_message_signalling_risk_to_life_gets_the_crisis_reply_without_a_model_call(gemini):
    reply = gemini.chat([ChatTurn(role="user", content="I lost everything and I want to die")])
    assert reply.reply == CRISIS_REPLY and reply.blocked is True
    assert gemini.requests == []


def test_a_blocked_prompt_gets_the_refusal_reply(gemini):
    gemini.replies.append(httpx.Response(200, json={"promptFeedback": {"blockReason": "SAFETY"}}))
    reply = gemini.chat([ChatTurn(role="user", content="something harmful")])
    assert reply.reply == REFUSAL_REPLY and reply.blocked is True
