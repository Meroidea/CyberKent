import type { NextFunction, Request, Response } from "express";
import { ZodError, type z, type ZodTypeAny } from "zod";
import { AppError, sendFail } from "@/lib/http";

/**
 * Parses a query string against a schema, for the handler to use in place of
 * `req.query`.
 *
 * A function rather than a middleware: Express 5 exposes `req.query` as a
 * getter, so it cannot be replaced the way `validateBody` replaces the body.
 * Returning the parsed value keeps the same guarantee — the handler only ever
 * reads the validated copy.
 */
export function parseQuery<T extends ZodTypeAny>(schema: T, req: Request): z.infer<T> {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    throw new AppError(
      422,
      "The filters are not valid.",
      result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    );
  }

  return result.data;
}

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
