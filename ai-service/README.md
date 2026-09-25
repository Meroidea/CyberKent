# CyberKent AI service

The FastAPI intelligence layer for CyberKent. It is called only by the Express
AI Gateway (`backend/src/modules/ai`), never by a browser, and holds no state
between requests. If it is stopped or unconfigured, the rest of CyberKent keeps
working and the AI features report themselves unavailable (constraint C3).

Every AI feature runs on **Google Gemini** (free tier), behind the provider
contract in `app/providers/base.py`. Set `GEMINI_API_KEY`; without it the
service starts and reports itself unconfigured.

| Endpoint | Purpose | How |
|---|---|---|
| `GET /health` | Liveness and whether it is configured | — |
| `POST /v1/analyse/text` | Scam classification, manipulation tactics, sentiment | generateContent + JSON Schema output |
| `POST /v1/analyse/image` | Image identification, brands, visual red flags | inline image + JSON Schema output |
| `POST /v1/assistant/chat` | CyberSafe Assistant chatbot | generateContent + safety filters + crisis check |

## Run

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # add GEMINI_API_KEY
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Test

```bash
.venv/bin/pytest -q
```

The tests replace the provider with a fake, so they run without a key and
without network access.

## Layout

```
app/
  main.py                 FastAPI app, error handlers, /health
  config.py               validated environment
  schemas.py              request models and the Structured Outputs schemas
  prompts.py              every prompt, versioned (PROMPT_VERSION)
  dependencies.py         provider selection and internal-token check
  providers/base.py       AiProvider protocol — the replaceable seam
  providers/gemini_provider.py  Google Gemini over REST
  providers/replies.py    fixed crisis and refusal replies
  routers/analysis.py     /v1/analyse/text, /v1/analyse/image
  routers/assistant.py    /v1/assistant/chat
tests/test_api.py
```
