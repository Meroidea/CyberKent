import type { NextFunction, Request, Response } from "express";
import { env } from "@/config/env";
import { AppError, sendFail } from "@/lib/http";

/** Anything that reached the router without matching a route. */
export function notFoundHandler(req: Request, res: Response): void {
  sendFail(res, 404, `No endpoint matches ${req.method} ${req.path}.`);
}

/**
 * The single place an error becomes a response (Rule 4.4).
 *
 * Only `AppError` carries a message intended for a client. Everything else is
 * logged server-side and answered generically, because the alternative is
 * leaking a Prisma error, a file path or a stack trace to whoever provoked it.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    sendFail(res, error.status, error.message, error.errors);
    return;
  }

  /* Body-parser rejections: malformed JSON and oversized bodies are the
     caller's mistake, and answering them as 500s would both mislead the
     client and page an operator for nothing. */
  const status = (error as { status?: number; type?: string } | null)?.status;

  if (status === 400 || status === 413) {
    sendFail(res, status, status === 413 ? "That request is too large." : "The request body is not valid JSON.");
    return;
  }

  /* Deliberately not sent to the client. */
  console.error("[unhandled]", error);

  sendFail(
    res,
    500,
    env.isProduction
      ? "Something went wrong on our side. Please try again."
      : `Unhandled error: ${error instanceof Error ? error.message : String(error)}`,
  );
}
