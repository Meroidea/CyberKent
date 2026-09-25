/**
 * How the AI features describe themselves to residents: by what they do, never
 * by whose model is behind them. One place, so the checker and the assistant
 * cannot say different things.
 *
 * The retention sentence still states the terms plainly — the model's free
 * service may keep what is sent — because that is what a resident needs to
 * decide what to paste. Who the processor is, and where, is set out in the
 * privacy statement, as the Privacy Act requires.
 */
export interface ProviderInfo {
  name: string;
  where: string;
  retention: string;
}

export const CYBERSAFE_AI: ProviderInfo = {
  name: "CyberSafe AI",
  where: "Council's AI service, which runs outside Australia",
  retention: "The AI service may keep what it is sent to improve itself, so do not include anything you would not want kept.",
};
