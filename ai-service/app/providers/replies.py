"""
Fixed replies the assistant gives without asking a model.

Kept apart from any provider: what a resident in distress is told, and what a
message the assistant will not engage with gets back, are Council's words and
must not change with the model behind the assistant.
"""

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
