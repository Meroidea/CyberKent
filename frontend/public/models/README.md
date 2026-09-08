# On-device model weights

This directory is filled at build time by `scripts/fetch-model.mjs` and is not committed —
the weights are tens of megabytes of binary, and a copy in every clone of the repository
buys nothing that a build-time fetch does not.

## Why the weights are served from here

The scam checker tells people, on the dialog itself, that their message is *"Checked on your
own device. Nothing is sent to Council or stored."* People put screenshots of banking apps,
family messages and identity documents through it. Sending those images to a hosted inference
API would make that sentence false.

So the model comes to the image instead. `transformers.js` runs the classifier in the browser
with `env.allowRemoteModels = false`, and the weights load from this site's own origin — which
means the existing `connect-src 'self'` in `vercel.json` covers them, and no third party learns
that a particular resident is checking a particular image.

## Deploying the model

```
npm run models:fetch
```

Run from `frontend/`. It writes `public/models/<repo>/` and is wired into `npm run build`, so
a Vercel deployment fetches the weights during its build and serves them as static assets.

The step is **non-fatal by design**. If the model host is unreachable, or the checkpoint has no
ONNX export, the build still succeeds — the image classifier reports itself unavailable, every
other check runs unchanged, and the report says plainly that the AI-image pass did not run. A
missing optional model must never be the reason a council service fails to deploy.

## Changing the checkpoint

The model id lives in exactly two places, and they must agree:

| File | Constant |
| --- | --- |
| `src/lib/scam/synthetic.ts` | `MODEL_ID` |
| `scripts/fetch-model.mjs` | `MODEL_ID` |

The checkpoint needs an ONNX export under `onnx/` in its repository to run in a browser. Most
detector checkpoints are published as PyTorch only; converting one is a separate step
(`optimum-cli export onnx`), and the output goes in this directory under the same layout.

## Read the verdict carefully

Detectors are trained against the generators that existed when they were built and generalise
poorly to ones that came later, so this pass is deliberately one indicator among several rather
than the answer. `INCONCLUSIVE_BELOW` and `SYNTHETIC_ABOVE` in `synthetic.ts` are what keep a
weak reading from being shown to a resident as a finding — a false "this photo of your
grandchild is fake" is a real harm, not a rounding error.
