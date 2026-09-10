"""
Request and response shapes for the AI service.

The *output* models double as the JSON schema the model is constrained to
(OpenAI Structured Outputs). That is the single most important reliability
decision in this service: the model cannot return prose where a score is
expected, or invent a field the interface does not know how to show, because
the response is validated against these classes before it leaves.

Rule 8.3 — every AI result carries a risk score, a confidence, an explanation
and the evidence used. Those four fields are required here, not optional.
"""

from typing import Literal

from pydantic import BaseModel, Field

Channel = Literal["sms", "email", "phone", "website", "social", "other"]

Verdict = Literal["likely_scam", "suspicious", "likely_genuine", "unclear"]

# Aligned with the Scamwatch taxonomy the service's categories are drawn from.
ScamType = Literal[
    "phishing",
    "parcel_delivery",
    "toll_or_fine",
    "government_impersonation",
    "bank_impersonation",
    "family_impersonation",
    "business_email_compromise",
    "payment_redirection",
    "investment",
    "romance",
    "job_or_employment",
    "prize_or_lottery",
    "remote_access_or_tech_support",
    "online_shopping",
    "charity",
    "identity_theft",
    "malware",
    "other",
    "none",
]

Emotion = Literal["fear", "urgency", "greed", "trust", "sympathy", "curiosity", "guilt", "excitement"]


# ── requests ────────────────────────────────────────────────────────────────


class RuleSummary(BaseModel):
    """What the on-device rule engine concluded, passed along as context."""

    score: int = Field(ge=0, le=100)
    band: Literal["high", "medium", "low", "unclear"]
    indicators: list[str] = Field(default_factory=list, max_length=40)


class TextAnalysisRequest(BaseModel):
    text: str = Field(min_length=1)
    channel: Channel = "other"
    rules: RuleSummary | None = None


class ImageAnalysisRequest(BaseModel):
    # A data: URL (PNG or JPEG). The browser has already stripped metadata by
    # re-encoding, so no EXIF — and no location — reaches this service.
    image: str = Field(min_length=32)
    context: str | None = Field(default=None, max_length=2_000)


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class AssistantRequest(BaseModel):
    messages: list[ChatTurn] = Field(min_length=1)


# ── model outputs (also the Structured Outputs schema) ──────────────────────


class Tactic(BaseModel):
    tactic: str = Field(description="Short name of the manipulation technique, e.g. 'False urgency'.")
    evidence: str = Field(description="The exact words from the message that show it, quoted verbatim.")
    explanation: str = Field(description="One plain-English sentence on why this is a warning sign.")


class EmotionScore(BaseModel):
    emotion: Emotion
    intensity: float = Field(description="0 to 1.")


class Sentiment(BaseModel):
    overall: Literal["negative", "neutral", "positive"]
    pressure_level: Literal["none", "low", "moderate", "high"]
    emotions: list[EmotionScore] = Field(description="Emotions the message tries to provoke, strongest first. Empty if none.")


class TextAnalysis(BaseModel):
    verdict: Verdict
    risk_score: int = Field(description="0 to 100, how scam-like the message is.")
    confidence: float = Field(description="0 to 1, how certain the assessment is.")
    scam_type: ScamType
    tactics: list[Tactic]
    sentiment: Sentiment
    explanation: str = Field(description="Plain English, at most 90 words, written for a worried non-expert.")
    genuine_signals: list[str] = Field(description="Anything suggesting the message may be genuine. Empty if none.")
    recommended_actions: list[str] = Field(description="Two to four concrete next steps.")


class Brand(BaseModel):
    name: str
    context: str = Field(description="Where it appears, e.g. 'logo at top', 'sender name'.")


class VisualFlag(BaseModel):
    flag: str
    explanation: str


class ImageAnalysis(BaseModel):
    image_type: Literal[
        "sms_screenshot",
        "email_screenshot",
        "chat_screenshot",
        "social_media_post",
        "website_or_login_page",
        "invoice_or_bill",
        "qr_code",
        "document_or_letter",
        "photo",
        "other",
    ]
    description: str = Field(description="One or two sentences describing what the image shows.")
    visible_text_summary: str = Field(description="The gist of any text visible in the image. Empty if none.")
    brands_detected: list[Brand]
    visual_red_flags: list[VisualFlag]
    verdict: Verdict
    risk_score: int = Field(description="0 to 100.")
    confidence: float = Field(description="0 to 1.")
    explanation: str = Field(description="Plain English, at most 90 words.")
    recommended_actions: list[str]


# ── envelopes returned to the gateway ───────────────────────────────────────


class Usage(BaseModel):
    model: str
    prompt_version: str
    latency_ms: int
    input_tokens: int | None = None
    output_tokens: int | None = None


class TextAnalysisResponse(BaseModel):
    result: TextAnalysis
    usage: Usage


class ImageAnalysisResponse(BaseModel):
    result: ImageAnalysis
    usage: Usage


class AssistantReply(BaseModel):
    reply: str
    # Set when moderation stopped the model being called at all.
    blocked: bool = False
    usage: Usage


class Health(BaseModel):
    status: Literal["ok"]
    configured: bool
    provider: str
    model: str
