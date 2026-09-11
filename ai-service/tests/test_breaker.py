"""
Retry and circuit-breaker policy of the OpenAI provider, tested without the
network by replacing the client's `responses.parse` with a stub.

A billing refusal (no credit) can never succeed on retry, so it must fail fast
and switch AI off for a cooldown; a transient 429 may succeed, so it is retried
once. Found necessary when a real account with no credit made every request
wait ~22 seconds for SDK retries that were certain to fail.
"""

import httpx
import openai
import pytest

from app.config import Settings
from app.providers.base import ProviderUnavailable
from app.providers.openai_provider import OpenAIProvider
from app.schemas import TextAnalysis


def status_error(status: int, code: str) -> openai.APIStatusError:
    request = httpx.Request("POST", "https://api.openai.com/v1/responses")
    response = httpx.Response(status, request=request, json={"error": {"code": code, "message": "x"}})
    return openai.APIStatusError("x", response=response, body={"error": {"code": code, "message": "x"}})


@pytest.fixture()
def provider(monkeypatch):
    monkeypatch.setattr("time.sleep", lambda _: None)
    return OpenAIProvider(Settings(OPENAI_API_KEY="sk-test"))


def test_billing_refusal_opens_the_breaker_and_fails_fast(provider):
    calls = []

    def refuse(**_):
        calls.append(1)
        raise status_error(429, "credit_balance_exhausted")

    provider._client.responses.parse = refuse

    with pytest.raises(ProviderUnavailable, match="billing"):
        provider.analyse_text("hello there", "sms", None)

    assert calls == [1], "a billing refusal must not be retried"
    assert provider.configured is False, "health must report AI unavailable during the cooldown"

    with pytest.raises(ProviderUnavailable, match="paused"):
        provider.analyse_text("hello again", "sms", None)

    assert calls == [1], "no request is sent while the breaker is open"


def test_transient_rate_limit_is_retried_once(provider):
    calls = []

    class Parsed:
        output_parsed = TextAnalysis.model_validate({
            "verdict": "likely_scam", "risk_score": 120, "confidence": 1.4, "scam_type": "toll_or_fine",
            "tactics": [], "sentiment": {"overall": "negative", "pressure_level": "high", "emotions": []},
            "explanation": "x", "genuine_signals": [], "recommended_actions": [],
        })
        model = "gpt-test"
        usage = None

    def flaky(**_):
        calls.append(1)
        if len(calls) == 1:
            raise status_error(429, "rate_limit_exceeded")
        return Parsed()

    provider._client.responses.parse = flaky
    result = provider.analyse_text("hello there", "sms", None).result

    assert len(calls) == 2
    assert result.risk_score == 100 and result.confidence == 1.0, "model output is clamped to the defined ranges"
    assert provider.configured is True
