import { createApp } from "@/app";
import { env } from "@/config/env";

/**
 * Long-running entry point, for local development and for any host that runs a
 * process rather than a function. The serverless entry is api/index.ts.
 */
const app = createApp();

app.listen(env.PORT, () => {
  console.log(`CyberKent API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
