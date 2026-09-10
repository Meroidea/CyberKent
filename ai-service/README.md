# CyberKent AI service

The FastAPI intelligence layer for CyberKent. It is called only by the Express
AI Gateway (`backend/src/modules/ai`), never by a browser, and holds no state
between requests. If it is stopped or unconfigured, the rest of CyberKent keeps
working and the AI features report themselves unavailable (constraint C3).

| Endpoint | Purpose | OpenAI capability |
|---|---|---|
| `GET /health` | Liveness and whether a key is configured | — |
| `POST /v1/analyse/text` | Scam classification, manipulation tactics, sentiment | Responses API + Structured Outputs |
| `POST /v1/analyse/image` | Image identification, brands, visual red flags | Vision (input_image) + Structured Outputs |
| `POST /v1/assistant/chat` | CyberSafe Assistant chatbot | Responses API + Moderation |

## Run

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # add OPENAI_API_KEY
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
  providers/openai_provider.py
  routers/analysis.py     /v1/analyse/text, /v1/analyse/image
  routers/assistant.py    /v1/assistant/chat
tests/test_api.py
```
