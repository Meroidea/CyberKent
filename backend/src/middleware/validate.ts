import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { sendFail } from "@/lib/http";

/**
 * Validates and replaces `req.body` with the parsed result.
 *
 * Rule 4.3 — no handler downstream trusts the client, because no handler
 * downstream ever sees the raw body. Replacing rather than merely checking is
 * what makes that guarantee hold: unknown keys are stripped by the schema, so
 * a caller cannot smuggle a field a later `create` would happily persist.
 */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        sendFail(
          res,
          422,
          "The submitted data is not valid.",
          error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        );
        return;
      }

      next(error);
    }
  };
}
