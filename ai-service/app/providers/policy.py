"""
The retry and circuit-breaker policy every provider runs under.

Two providers with two SDKs still owe residents the same behaviour when a
provider misbehaves, so the policy lives here once (Rule 1.3) and each provider
supplies only the part that is genuinely its own: how to read its SDK's
exceptions. What to do about them is decided here.

The policy exists because of a measured failure. An account with no credit
answered every request with a refusal that no retry could fix, and the SDK's
own retries spent ~22 seconds per request discovering that before failing
anyway. So a refusal that cannot succeed is told apart from one that might:

- `RETRY`  — a busy moment. Tried once more, after a second.
- `TRIP`   — no credit, or a quota that will not reset soon. The breaker opens,
             the service reports AI unavailable, and nothing is sent until the
             cooldown passes, so no resident waits on a certain failure.
- `FAIL`   — anything else. Reported now, without a retry.

A timeout is never retried under any classification: it has already spent the
whole budget the caller allowed.
"""

import time
from dataclasses import dataclass
from enum import Enum
from typing import Callable, TypeVar

from app.providers.base import ProviderUnavailable

Result = TypeVar("Result")

# How long AI stays switched off after a refusal that retrying cannot fix.
COOLDOWN_SECONDS = 600

# Pause between the first attempt and the second.
RETRY_DELAY_SECONDS = 1.0


class Action(Enum):
    RETRY = "retry"
    TRIP = "trip"
    FAIL = "fail"


@dataclass(frozen=True)
class Verdict:
    """What to do about one provider exception, and what to say if we stop."""

    action: Action
    # Written for the server log, so it names the class of failure and never
    # the provider's response body — that body can echo a resident's message
    # back (Rule 6.7).
    message: str


class Breaker:
    """Per-provider retry loop and cooldown. One instance per provider."""

    def __init__(self, cooldown_seconds: float = COOLDOWN_SECONDS) -> None:
        self._cooldown = cooldown_seconds
        self._open_until = 0.0

    @property
    def closed(self) -> bool:
        """False while the breaker is open, which is what health reports as unavailable."""
        return time.monotonic() >= self._open_until

    def trip(self) -> None:
        self._open_until = time.monotonic() + self._cooldown

    def check(self) -> None:
        if not self.closed:
            raise ProviderUnavailable("AI is paused after a refusal the provider will not retry.")

    def run(
        self,
        operation: Callable[[], Result],
        classify: Callable[[Exception], Verdict | None],
    ) -> Result:
        """
        Runs `operation`, applying the policy to anything `classify` recognises.

        `classify` returns None for an exception that is not the provider's to
        explain — a bug in our own code, say — which is then left to propagate
        untouched rather than being reported to residents as an AI outage.
        """
        self.check()

        for attempt in (1, 2):
            try:
                return operation()
            except Exception as error:  # noqa: BLE001 — re-raised below unless classified
                verdict = classify(error)

                if verdict is None:
                    raise

                if verdict.action is Action.TRIP:
                    self.trip()
                    minutes = int(self._cooldown // 60)
                    raise ProviderUnavailable(f"{verdict.message}; AI paused for {minutes} minutes.") from error

                if verdict.action is Action.RETRY and attempt == 1:
                    time.sleep(RETRY_DELAY_SECONDS)
                    continue

                raise ProviderUnavailable(verdict.message) from error

        raise ProviderUnavailable("The AI provider did not answer.")
