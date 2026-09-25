"""
Contract tests for the AI service, run without calling the model.

The provider is replaced with a fake through FastAPI's dependency override —
the same seam a different provider would be plugged into — so these tests check
the service's own behaviour: authentication, validation, size limits, schema
shape and the degradation path when the provider is unavailable.

    .venv/bin/pytest -q
"""

import base64

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.dependencies import get_provider
from app.main import app
from app.providers.base import ProviderUnavailable
from app.schemas import (
    AssistantReply,
    ImageAnalysis,
    ImageAnalysisResponse,
    Sentiment,
    TextAnalysis,
    TextAnalysisResponse,
    Usage,
)

USAGE = Usage(model="fake-model", prompt_version="test", latency_ms=1)
PNG_1PX = "data:image/png;base64," + base64.b64encode(
    bytes.fromhex(
        "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
        "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082"
    )
).decode()


class FakeProvider:
    name = "fake"
    model = "fake-model"
    configured = True

    def __init__(self, fail: bool = False) -> None:
        self.fail = fail
        self.seen: list = []

    def analyse_text(self, text, channel, rules):
        if self.fail:
            raise ProviderUnavailable("down")
        self.seen.append((text, channel, rules))
        return TextAnalysisResponse(
            result=TextAnalysis(
                verdict="likely_scam", risk_score=91, confidence=0.9, scam_type="toll_or_fine",
                tactics=[], sentiment=Sentiment(overall="negative", pressure_level="high", emotions=[]),
                explanation="x", genuine_signals=[], recommended_actions=["Do not click the link."],
            ),
            usage=USAGE,
        )

    def analyse_image(self, image, context):
        return ImageAnalysisResponse(
            result=ImageAnalysis(
                image_type="sms_screenshot", description="d", visible_text_summary="", brands_detected=[],
                visual_red_flags=[], verdict="unclear", risk_score=10, confidence=0.3, explanation="e",
                recommended_actions=[],
            ),
            usage=USAGE,
        )

    def chat(self, messages):
        return AssistantReply(reply=f"echo {len(messages)}", usage=USAGE)


@pytest.fixture()
def fake():
    provider = FakeProvider()
    app.dependency_overrides[get_provider] = lambda: provider
    yield provider
    app.dependency_overrides.clear()


@pytest.fixture()
def client():
    return TestClient(app)


def test_health_reports_configuration(client, fake):
    body = client.get("/health").json()
    assert body == {"status": "ok", "configured": True, "provider": "fake", "model": "fake-model"}


def test_text_analysis_returns_the_structured_result(client, fake):
    response = client.post("/v1/analyse/text", json={"text": "Pay your toll now", "channel": "sms",
                                                    "rules": {"score": 80, "band": "high", "indicators": ["Urgency"]}})
    assert response.status_code == 200
    result = response.json()["result"]
    assert result["verdict"] == "likely_scam" and 0 <= result["risk_score"] <= 100
    assert fake.seen[0][2].band == "high"


def test_overlong_text_is_refused_before_the_provider_is_called(client, fake):
    response = client.post("/v1/analyse/text", json={"text": "a" * (get_settings().max_text_chars + 1)})
    assert response.status_code == 413 and fake.seen == []


def test_validation_errors_do_not_echo_the_submitted_content(client, fake):
    response = client.post("/v1/analyse/text", json={"text": "secret message", "channel": "carrier-pigeon"})
    assert response.status_code == 422 and "secret message" not in response.text


def test_only_png_or_jpeg_data_urls_are_accepted(client, fake):
    assert client.post("/v1/analyse/image", json={"image": "https://example.com/" + "x" * 40}).status_code == 422
    assert client.post("/v1/analyse/image", json={"image": PNG_1PX}).status_code == 200


def test_assistant_requires_the_last_turn_to_be_the_user(client, fake):
    turns = [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]
    assert client.post("/v1/assistant/chat", json={"messages": turns}).status_code == 422


def test_assistant_forwards_only_the_most_recent_turns(client, fake):
    turns = [{"role": "user" if i % 2 == 0 else "assistant", "content": f"m{i}"} for i in range(31)]
    body = client.post("/v1/assistant/chat", json={"messages": turns}).json()
    assert body["reply"] == f"echo {get_settings().max_chat_turns}"


def test_provider_outage_degrades_to_503(client):
    app.dependency_overrides[get_provider] = lambda: FakeProvider(fail=True)
    try:
        response = client.post("/v1/analyse/text", json={"text": "hello there"})
        assert response.status_code == 503 and response.json() == {"detail": "AI analysis is unavailable."}
    finally:
        app.dependency_overrides.clear()


def test_internal_token_is_enforced_when_configured(client, fake, monkeypatch):
    monkeypatch.setattr(get_settings(), "internal_token", "s" * 32)
    assert client.post("/v1/analyse/text", json={"text": "hello"}).status_code == 401
    ok = client.post("/v1/analyse/text", json={"text": "hello"}, headers={"X-Internal-Token": "s" * 32})
    assert ok.status_code == 200
