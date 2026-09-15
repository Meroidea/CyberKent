"""
Which provider a deployment gets, and what the two must agree on.

Rule 8.2 says the provider is configuration, not a code path. These check that
the configuration actually decides it, that adding a key never silently changes
which model reads residents' messages, and that the two providers cannot drift
apart on the one reply where drifting matters.
"""

import pytest

from app.config import Settings
from app.dependencies import PROVIDERS
from app.providers.base import AiProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.safety import CRISIS_REPLY, looks_like_crisis
from app.schemas import ChatTurn


def settings(**env) -> Settings:
    # Explicit Nones so a real .env on the developer's machine cannot decide
    # the outcome of a test about configuration.
    return Settings(**{"OPENAI_API_KEY": None, "GEMINI_API_KEY": None, "GOOGLE_API_KEY": None, **env})


# ── selection ───────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "env, expected, configured",
    [
        ({}, "openai", False),
        ({"OPENAI_API_KEY": "sk-x"}, "openai", True),
        ({"GEMINI_API_KEY": "g-x"}, "gemini", True),
        ({"GOOGLE_API_KEY": "g-x"}, "gemini", True),
        # Both keys present: the one already in service keeps serving.
        ({"OPENAI_API_KEY": "sk-x", "GEMINI_API_KEY": "g-x"}, "openai", True),
        # Named explicitly, which is how a deployment holding both says which.
        ({"AI_PROVIDER": "gemini", "OPENAI_API_KEY": "sk-x", "GEMINI_API_KEY": "g-x"}, "gemini", True),
        ({"AI_PROVIDER": "openai", "GEMINI_API_KEY": "g-x"}, "openai", False),
        # Asked for by name but given no key: chosen, and honestly unconfigured.
        ({"AI_PROVIDER": "gemini"}, "gemini", False),
    ],
)
def test_configuration_decides_the_provider(env, expected, configured):
    resolved = settings(**env)

    assert resolved.provider == expected
    assert resolved.configured is configured


def test_adding_a_gemini_key_does_not_move_an_openai_deployment():
    """Which model assesses a resident's message is never a side effect."""
    before = settings(OPENAI_API_KEY="sk-x")
    after = settings(OPENAI_API_KEY="sk-x", GEMINI_API_KEY="g-x")

    assert before.provider == after.provider == "openai"


def test_an_unknown_provider_name_is_refused_at_start_up():
    with pytest.raises(ValueError):
        settings(AI_PROVIDER="llama-on-a-laptop")


def test_every_registered_provider_satisfies_the_contract():
    assert set(PROVIDERS) == {"openai", "gemini"}

    for name, build in PROVIDERS.items():
        provider: AiProvider = build(settings(OPENAI_API_KEY="sk-x", GEMINI_API_KEY="g-x"))
        assert provider.name == name
        assert isinstance(provider.model, str) and provider.model
        # `configured` and the three capabilities are what the routes depend on.
        for method in ("analyse_text", "analyse_image", "chat"):
            assert callable(getattr(provider, method))
        assert isinstance(provider.configured, bool)


# ── what the two providers must agree on ────────────────────────────────────


@pytest.mark.parametrize(
    "message",
    [
        "I lost everything, I want to kill myself",
        "after this scam I feel suicidal",
        "there is no point in living now",
        "I've been thinking about ending my life",
        "honestly I'd be better off dead",
    ],
)
def test_distress_is_recognised(message):
    assert looks_like_crisis(message) is True


@pytest.mark.parametrize(
    "message",
    [
        "I got a text saying my parcel is held",
        "they said they would kill my credit rating",
        "this scam is killing me with paperwork",
        "my laptop died and I lost the screenshot",
    ],
)
def test_ordinary_scam_talk_is_not_mistaken_for_distress(message):
    assert looks_like_crisis(message) is False


def test_both_providers_answer_a_person_in_crisis_with_the_same_words(monkeypatch):
    """
    The one reply that must not depend on which provider Council is paying for.

    Neither call is allowed to reach a network: on the OpenAI side the check
    also runs ahead of moderation, which fails open when it is unreachable.
    """
    monkeypatch.setattr("time.sleep", lambda _: None)

    configured = settings(OPENAI_API_KEY="sk-x", GEMINI_API_KEY="g-x")
    openai_provider = OpenAIProvider(configured)
    gemini_provider = GeminiProvider(configured)

    def explode(*_args, **_kwargs):
        raise AssertionError("no request may be sent for a message like this")

    openai_provider._client.responses.create = explode
    openai_provider._client.moderations.create = explode
    gemini_provider._client.models.generate_content = explode

    turn = [ChatTurn(role="user", content="I lost my savings and I want to kill myself")]

    from_openai = openai_provider.chat(turn)
    from_gemini = gemini_provider.chat(turn)

    assert from_openai.reply == from_gemini.reply == CRISIS_REPLY
    assert from_openai.blocked is from_gemini.blocked is True
