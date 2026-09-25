/**
 * How each AI provider is named to residents, and what it does with what they
 * send. One place, so the checker, the assistant and the privacy statement
 * cannot say different things about the same provider.
 *
 * The retention sentence is the provider's own terms stated plainly: Gemini's
 * free tier lets Google keep submissions and use them to improve its products;
 * OpenAI is asked not to keep them (`store: false`).
 */
export interface ProviderInfo {
  name: string;
  where: string;
  retention: string;
}

const GEMINI: ProviderInfo = {
  name: "Google Gemini",
  where: "Google's Gemini service, outside Australia",
  retention: "On the free service Google may keep it and use it to improve its products, so do not include anything you would not want kept.",
};

const PROVIDERS: Record<string, ProviderInfo> = {
  gemini: GEMINI,
  openai: {
    name: "OpenAI",
    where: "OpenAI in the United States",
    retention: "OpenAI is asked not to keep it.",
  },
};

/** The provider the site is configured for when the AI service cannot be asked. */
export const DEFAULT_PROVIDER = "gemini";

export function providerInfo(provider: string | null | undefined): ProviderInfo {
  return PROVIDERS[provider ?? ""] ?? GEMINI;
}
