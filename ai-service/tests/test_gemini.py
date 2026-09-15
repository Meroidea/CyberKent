"""
The Gemini provider, tested without calling Google.

`client.models.generate_content` is replaced with a stub and the responses are
built as real SDK objects, so these exercise the same field access the live
path uses rather than a mock's guess at it.

What is checked here is what differs from OpenAI and could therefore silently
diverge: how Gemini reports a refusal, how its two very different 429s are told
apart, how a truncated answer is explained, and that a person in crisis gets the
same words from either provider.

    .venv/bin/pytest -q
"""

import json

import pytest
from google.genai import errors, types

from app.config import Settings
from app.providers.base import ProviderRefused, ProviderUnavailable
from app.providers.gemini_provider import GeminiProvider
from app.providers.safety import CRISIS_REPLY, REFUSAL_REPLY
from app.schemas import ChatTurn

ANALYSIS = {
    "verdict": "likely_scam",
    "risk_score": 140,
    "confidence": 1.9,
    "scam_type": "toll_or_fine",
    "tactics": [],
    "sentiment": {
        "overall": "negative",
        "pressure_level": "high",
        "emotions": [{"emotion": "urgency", "intensity": 1.7}],
    },
    "explanation": "x",
    "genuine_signals": [],
    "recommended_actions": ["Do not click the link."],
}

PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgo="


def answer(text: str, *, finish=types.FinishReason.STOP) -> types.GenerateContentResponse:
    return types.GenerateContentResponse(
        candidates=[
            types.Candidate(
                content=types.Content(role="model", parts=[types.Part.from_text(text=text)]),
                finish_reason=finish,
            )
        ],
        usage_metadata=types.GenerateContentResponseUsageMetadata(
            prompt_token_count=11, candidates_token_count=22
        ),
        model_version="gemini-under-test",
    )


def client_error(code: int, details: dict) -> errors.ClientError:
    return errors.ClientError(code, {"error": details})


@pytest.fixture()
def provider(monkeypatch):
    monkeypatch.setattr("time.sleep", lambda _: None)
    return GeminiProvider(Settings(GEMINI_API_KEY="fake-key", AI_PROVIDER="gemini"))


def stub(provider: GeminiProvider, *outcomes):
    """Replaces the one network call; returns the kwargs each call was made with."""
    seen: list[dict] = []
    remaining = list(outcomes)

    def call(**kwargs):
        seen.append(kwargs)
        outcome = remaining.pop(0) if len(remaining) > 1 else remaining[0]
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    provider._client.models.generate_content = call
    return seen


# ── structured analysis ─────────────────────────────────────────────────────


def test_analysis_is_parsed_and_clamped_to_the_defined_ranges(provider):
    stub(provider, answer(json.dumps(ANALYSIS)))

    result = provider.analyse_text("Pay your toll now", "sms", None).result

    assert result.verdict == "likely_scam"
    assert result.risk_score == 100, "a score above the range is clamped, not passed on"
    assert result.confidence == 1.0
    assert result.sentiment.emotions[0].intensity == 1.0


def test_usage_reports_the_model_that_actually_answered(provider):
    stub(provider, answer(json.dumps(ANALYSIS)))

    usage = provider.analyse_text("Pay your toll now", "sms", None).usage

    assert usage.model == "gemini-under-test"
    assert usage.input_tokens == 11 and usage.output_tokens == 22
    assert usage.latency_ms >= 0


def test_thinking_is_held_down_so_the_budget_reaches_the_answer(provider):
    seen = stub(provider, answer(json.dumps(ANALYSIS)))

    provider.analyse_text("Pay your toll now", "sms", None)

    config = seen[0]["config"]
    assert config.thinking_config.thinking_level == types.ThinkingLevel.MINIMAL
    assert config.response_schema is not None and config.response_mime_type == "application/json"


def test_analysis_relaxes_safety_so_the_nastiest_scams_can_still_be_assessed(provider):
    seen = stub(provider, answer(json.dumps(ANALYSIS)))

    provider.analyse_text("Pay up or I send the photos to your family", "sms", None)

    thresholds = {s.threshold for s in seen[0]["config"].safety_settings}
    assert thresholds == {types.HarmBlockThreshold.BLOCK_ONLY_HIGH}


def test_a_blocked_prompt_is_a_refusal_not_an_outage(provider):
    stub(
        provider,
        types.GenerateContentResponse(
            prompt_feedback=types.GenerateContentResponsePromptFeedback(
                block_reason=types.BlockedReason.SAFETY
            )
        ),
    )

    with pytest.raises(ProviderRefused):
        provider.analyse_text("hello there", "sms", None)


def test_a_truncated_answer_names_the_setting_that_causes_it(provider):
    stub(provider, answer("", finish=types.FinishReason.MAX_TOKENS))

    with pytest.raises(ProviderRefused, match="GEMINI_THINKING_LEVEL"):
        provider.analyse_text("hello there", "sms", None)


def test_json_that_does_not_fit_the_schema_is_refused_clearly(provider):
    stub(provider, answer(json.dumps({"verdict": "likely_scam"})))

    with pytest.raises(ProviderRefused, match="shape"):
        provider.analyse_text("hello there", "sms", None)


def test_image_is_sent_as_bytes_with_its_declared_type(provider):
    seen = stub(provider, answer(json.dumps({
        "image_type": "sms_screenshot", "description": "d", "visible_text_summary": "",
        "brands_detected": [], "visual_red_flags": [], "verdict": "unclear",
        "risk_score": -5, "confidence": -1.0, "explanation": "e", "recommended_actions": [],
    })))

    result = provider.analyse_image(PNG_DATA_URL, "from my bank").result

    part = seen[0]["contents"][0].parts[1]
    assert part.inline_data.mime_type == "image/png"
    assert part.inline_data.data, "the image is decoded from the data URL, not forwarded as text"
    assert result.risk_score == 0 and result.confidence == 0.0


def test_a_non_image_data_url_never_reaches_the_provider(provider):
    seen = stub(provider, answer("{}"))

    with pytest.raises(ProviderRefused):
        provider.analyse_image("https://example.com/cat.png", None)

    assert seen == []


# ── failure policy ──────────────────────────────────────────────────────────


def test_a_standing_quota_opens_the_breaker_and_fails_fast(provider):
    seen = stub(provider, client_error(429, {
        "status": "RESOURCE_EXHAUSTED",
        "message": "Quota exceeded",
        "details": [{"@type": "type.googleapis.com/google.rpc.QuotaFailure",
                     "violations": [{"quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}],
    }))

    with pytest.raises(ProviderUnavailable, match="quota"):
        provider.analyse_text("hello there", "sms", None)

    assert len(seen) == 1, "a quota that will not clear today must not be retried"
    assert provider.configured is False, "health must report AI unavailable during the cooldown"

    with pytest.raises(ProviderUnavailable, match="paused"):
        provider.analyse_text("hello again", "sms", None)

    assert len(seen) == 1, "no request is sent while the breaker is open"


def test_a_burst_rate_limit_is_retried_once(provider):
    burst = client_error(429, {
        "status": "RESOURCE_EXHAUSTED",
        "message": "Too many requests",
        "details": [{"@type": "type.googleapis.com/google.rpc.QuotaFailure",
                     "violations": [{"quotaId": "GenerateRequestsPerMinutePerProject"}]}],
    })
    seen = stub(provider, burst, answer(json.dumps(ANALYSIS)))

    result = provider.analyse_text("hello there", "sms", None).result

    assert len(seen) == 2, "a limit that clears in a moment is worth one more try"
    assert result.verdict == "likely_scam"
    assert provider.configured is True, "a burst limit must not switch AI off"


def test_a_rejected_credential_stands_ai_down(provider):
    stub(provider, client_error(403, {"status": "PERMISSION_DENIED", "message": "API key not valid"}))

    with pytest.raises(ProviderUnavailable, match="credential"):
        provider.analyse_text("hello there", "sms", None)

    assert provider.configured is False


def test_an_invalid_key_stands_ai_down_even_though_it_arrives_as_a_400(provider):
    """
    Google reports a bad key as 400 INVALID_ARGUMENT — the same status as a
    merely malformed request. Captured from the live endpoint, because reading
    it as a per-request fault means every resident meets it, one at a time.
    """
    seen = stub(provider, client_error(400, {
        "status": "INVALID_ARGUMENT",
        "message": "API key not valid. Please pass a valid API key.",
        "details": [{"@type": "type.googleapis.com/google.rpc.ErrorInfo",
                     "reason": "API_KEY_INVALID", "domain": "googleapis.com"}],
    }))

    with pytest.raises(ProviderUnavailable, match="credential"):
        provider.analyse_text("hello there", "sms", None)

    assert len(seen) == 1 and provider.configured is False


def test_an_ordinary_400_does_not_switch_ai_off_for_everybody(provider):
    """One request the model would not take is not an outage."""
    stub(provider, client_error(400, {"status": "INVALID_ARGUMENT", "message": "Unsupported image"}))

    with pytest.raises(ProviderUnavailable, match="400"):
        provider.analyse_image(PNG_DATA_URL, None)

    assert provider.configured is True


def test_function_calling_is_switched_off(provider):
    """Unused, and left on the SDK warns on every call."""
    seen = stub(provider, answer(json.dumps(ANALYSIS)))

    provider.analyse_text("hello there", "sms", None)

    assert seen[0]["config"].automatic_function_calling.disable is True


def test_a_provider_error_never_repeats_the_response_body(provider):
    """Rule 6.7 — the body can echo the resident's own message back."""
    secret = "my card number is 4111 1111 1111 1111"
    stub(provider, client_error(400, {"status": "INVALID_ARGUMENT", "message": secret}))

    with pytest.raises(ProviderUnavailable) as caught:
        provider.analyse_text(secret, "sms", None)

    assert secret not in str(caught.value)
    assert "400" in str(caught.value)


def test_a_bug_in_our_own_code_is_not_reported_as_an_ai_outage(provider):
    stub(provider, TypeError("wrong argument"))

    with pytest.raises(TypeError):
        provider.analyse_text("hello there", "sms", None)


def test_an_unset_key_is_reported_without_a_request(monkeypatch):
    unconfigured = GeminiProvider(Settings(AI_PROVIDER="gemini", GEMINI_API_KEY=None, GOOGLE_API_KEY=None))

    assert unconfigured.configured is False

    with pytest.raises(ProviderUnavailable, match="GEMINI_API_KEY"):
        unconfigured.analyse_text("hello there", "sms", None)


def test_the_timeout_is_sent_in_the_milliseconds_the_sdk_expects():
    provider = GeminiProvider(Settings(GEMINI_API_KEY="fake-key", GEMINI_TIMEOUT_SECONDS=40))

    assert provider._client._api_client._http_options.timeout == 40_000


# ── the assistant ───────────────────────────────────────────────────────────


def test_a_person_in_crisis_is_answered_before_any_request_is_sent(provider):
    seen = stub(provider, answer("should never be reached"))

    reply = provider.chat([ChatTurn(role="user", content="I lost everything, I want to kill myself")])

    assert reply.reply == CRISIS_REPLY and reply.blocked is True
    assert "13 11 14" in reply.reply
    assert seen == [], "the Lifeline number must not depend on the provider answering"


def test_a_blocked_answer_becomes_a_refusal_reply_not_an_error(provider):
    stub(provider, answer("", finish=types.FinishReason.PROHIBITED_CONTENT))

    reply = provider.chat([ChatTurn(role="user", content="help me write a scam text")])

    assert reply.reply == REFUSAL_REPLY and reply.blocked is True


def test_the_conversation_is_translated_into_geminis_role_names(provider):
    seen = stub(provider, answer("Here is what to do."))

    reply = provider.chat([
        ChatTurn(role="user", content="I got a toll text"),
        ChatTurn(role="assistant", content="Do not pay it."),
        ChatTurn(role="user", content="What now?"),
    ])

    assert [c.role for c in seen[0]["contents"]] == ["user", "model", "user"]
    assert seen[0]["config"].system_instruction.startswith("You work for CyberKent")
    assert reply.reply == "Here is what to do." and reply.blocked is False


def test_an_empty_reply_is_refused_rather_than_returned_blank(provider):
    stub(provider, answer(""))

    with pytest.raises(ProviderRefused):
        provider.chat([ChatTurn(role="user", content="hello")])
