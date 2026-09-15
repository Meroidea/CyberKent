"""
What the assistant says when it will not answer normally, and when it says it.

Held here rather than inside one provider because the words a frightened person
reads must not depend on which model Council happens to be paying for this
month (Rule 8.2). Both providers import these replies, so the two cannot drift.

The providers detect harm differently, because their platforms differ: OpenAI
has a dedicated moderation model and Gemini has safety filters built into the
generation call. Neither is relied on for the crisis path. `looks_like_crisis`
runs first, in this process, before any network call — so the Lifeline number
reaches someone even when the provider is slow, refusing, or switched off, and
it reaches them identically on either provider.
"""

import re

CRISIS_REPLY = (
    "I'm sorry you're going through this. If you are in danger, call 000 now. "
    "If you are feeling overwhelmed or thinking about harming yourself, please call "
    "Lifeline on 13 11 14 (24 hours) or text 0477 13 11 14.\n\n"
    "Being scammed is a crime committed against you — it is not your fault. When you are "
    "ready, contact your bank first, then IDCARE on 1800 595 160 for free, confidential support."
)

REFUSAL_REPLY = (
    "I can't help with that message. I can help with recognising scams, what to do after "
    "being targeted, reporting a scam, and keeping your accounts safe."
)

# Phrases that mean someone is telling us they are in trouble.
#
# Deliberately a short, readable list of first-person statements rather than a
# classifier. Two reasons. It can be read and argued with by the people
# responsible for the service, which a model's judgement cannot; and the cost of
# its two error directions is nothing like symmetric — offering Lifeline to
# someone who was speaking figuratively costs them a paragraph they can ignore,
# while missing someone who was not costs something no scam advice makes up for.
#
# It never has to be complete. It runs in front of the provider's own safety
# machinery, which still catches what these patterns do not.
_CRISIS_PATTERNS = (
    r"\bkill (?:myself|me)\b",
    r"\b(?:end|ending|take|taking) my (?:own )?life\b",
    r"\bending it all\b",
    r"\bsuicid(?:e|al)\b",
    r"\bharm(?:ing)? myself\b",
    r"\bhurt(?:ing)? myself\b",
    r"\bself[- ]harm\b",
    r"\bdon'?t want to (?:live|be here|go on)\b",
    r"\bno (?:reason|point) (?:to|in) (?:living|going on)\b",
    r"\bbetter off (?:dead|without me)\b",
    r"\bwant to die\b",
)

_CRISIS = re.compile("|".join(_CRISIS_PATTERNS), re.IGNORECASE)


def looks_like_crisis(text: str) -> bool:
    """True when a message says, in plain words, that the person may be at risk."""
    return bool(_CRISIS.search(text))
