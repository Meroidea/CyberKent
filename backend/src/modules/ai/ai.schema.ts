import { z } from "zod";

/**
 * Request contracts for the AI Gateway (Rule 4.3).
 *
 * The ceilings match the AI service's own, so an oversized request is refused
 * here with a named field rather than travelling to Python to be refused there.
 */

const channel = z.enum(["sms", "email", "phone", "website", "social", "other"]);

export const analyseTextSchema = z
  .object({
    text: z.string().trim().min(12, "Paste the whole message.").max(8_000, "That message is too long to analyse."),
    channel: channel.default("other"),
    /* What the on-device rules concluded, sent as context for the model. */
    rules: z
      .object({
        score: z.number().int().min(0).max(100),
        band: z.enum(["high", "medium", "low", "unclear"]),
        indicators: z.array(z.string().max(120)).max(40),
      })
      .strict()
      .optional(),
  })
  .strict();

/* ~5 MB of image once base64's 4/3 expansion is accounted for. */
const MAX_IMAGE_DATA_URL = 7_000_000;

export const analyseImageSchema = z
  .object({
    image: z
      .string()
      .max(MAX_IMAGE_DATA_URL, "That image is too large to analyse.")
      .regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/, "Send the image as a PNG or JPEG."),
    context: z.string().trim().max(2_000).optional(),
  })
  .strict();

export const assistantSchema = z
  .object({
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().min(1).max(2_000, "That message is too long."),
          })
          .strict(),
      )
      .min(1)
      .max(40),
  })
  .strict();

export type AnalyseTextInput = z.infer<typeof analyseTextSchema>;
export type AnalyseImageInput = z.infer<typeof analyseImageSchema>;
export type AssistantInput = z.infer<typeof assistantSchema>;
