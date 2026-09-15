# CyberKent AI service

The FastAPI intelligence layer for CyberKent. It is called only by the Express
AI Gateway (`backend/src/modules/ai`), never by a browser, and holds no state
between requests. If it is stopped or unconfigured, the rest of CyberKent keeps
working and the AI features report themselves unavailable (constraint C3).

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness, which provider is serving, and whether it holds a key |
| `POST /v1/analyse/text` | Scam classification, manipulation tactics, sentiment |
| `POST /v1/analyse/image` | Image identification, brands, visual red flags |
| `POST /v1/assistant/chat` | CyberSafe Assistant chatbot |

## Providers

Rule 8.2 — the provider is configuration, not a code path. Two are implemented,
behind one `AiProvider` protocol; no route, schema, prompt or gateway names
either of them.

| | OpenAI | Gemini |
|---|---|---|
| Structured analysis | Responses API + Structured Outputs | `generate_content` + `response_schema` |
| Image | `input_image` | `inline_data` part |
| Assistant | Responses API + Moderation endpoint | `generate_content` + built-in safety filters |
| Retention control | `store=False` per request | **none — see below** |
| Per-request abuse identifier | `safety_identifier` | none available |
| Default model | `gpt-4.1-mini` | `gemini-3.5-flash` |

Both run the same retry and circuit-breaker policy (`app/providers/policy.py`)
and return the same crisis and refusal wording (`app/providers/safety.py`), so
what a resident gets does not depend on which one Council is paying for.

### Choosing one

`AI_PROVIDER` is `auto`, `openai` or `gemini`. On `auto` the service takes
whichever key it finds, preferring OpenAI — so adding a Gemini key beside an
existing OpenAI one does **not** silently change which model reads residents'
messages. Name the provider explicitly to switch.

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=...        # or GOOGLE_API_KEY, which the Google SDK also reads
```

`GET /health` reports which provider answered the question, and every analysis
carries `usage.provider`, which the gateway writes to `AiInteraction` — so a
month's usage can be read back per provider rather than per assumption.

### Before pointing Gemini at residents' messages

**Use a paid API key.** On the Gemini Developer API, prompts sent with a *free*
key may be used by Google to improve their products; on a paid key they are
not. OpenAI is sent `store=False` on every request and Gemini has no equivalent
flag, so the billing tier is the whole of the control. A Council service
handling scam reports and the messages inside them should not be on a free key.

Two further differences are deliberate and documented in
`app/providers/gemini_provider.py`:

- **Thinking is held to `minimal`.** On Gemini, `max_output_tokens` bounds the
  model's silent reasoning *and* its answer together, so a tight ceiling can be
  spent entirely on reasoning and return nothing. Raise
  `GEMINI_THINKING_LEVEL` only after checking results still come back.
- **Safety thresholds are relaxed on the analysis endpoints only.** The service
  is asked to read attacker-authored content on a victim's behalf — sextortion,
  threats and blackmail are exactly what residents most need assessed, and
  under Gemini's default thresholds the model refuses some of them. The
  assistant endpoint, which is a conversation rather than evidence, keeps
  Gemini's defaults.

## Run

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # add OPENAI_API_KEY or GEMINI_API_KEY
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Test

```bash
.venv/bin/pytest -q
```

No key and no network access are needed. `test_api.py` replaces the provider
through the dependency override; `test_gemini.py` stubs the SDK's call site;
`test_gemini_wire.py` runs the real SDK against a fake Gemini server over
`httpx`, so the request that would go to Google is asserted byte for byte.

## Layout

```
app/
  main.py                 FastAPI app, error handlers, /health
  config.py               validated environment, provider selection
  schemas.py              request models and the structured-output schemas
  prompts.py              every prompt, versioned (PROMPT_VERSION)
  dependencies.py         provider registry and internal-token check
  providers/base.py       AiProvider protocol — the replaceable seam
  providers/policy.py     retry and circuit-breaker policy, shared
  providers/safety.py     crisis and refusal replies, shared
  providers/openai_provider.py
  providers/gemini_provider.py
  routers/analysis.py     /v1/analyse/text, /v1/analyse/image
  routers/assistant.py    /v1/assistant/chat
tests/
  test_api.py             service contract, auth, limits, degradation
  test_breaker.py         OpenAI retry and breaker behaviour
  test_gemini.py          Gemini behaviour and failure classification
  test_gemini_wire.py     the bytes that go to Google
  test_provider_selection.py   which provider a deployment gets
```
