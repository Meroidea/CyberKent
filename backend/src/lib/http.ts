import type { Response } from "express";

/**
 * The single response envelope, per Rule 4.2.
 *
 * Every endpoint answers in this shape — success and failure alike — so a
 * client never has to branch on which endpoint it called to find out where the
 * payload or the error lives.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: { field?: string; message: string }[];
}

export function sendOk<T>(res: Response, data: T, message = "OK", status = 200): void {
  const body: ApiEnvelope<T> = { success: true, message, data, errors: [] };
  res.status(status).json(body);
}

export function sendFail(
  res: Response,
  status: number,
  message: string,
  errors: { field?: string; message: string }[] = [],
): void {
  const body: ApiEnvelope<never> = { success: false, message, data: null, errors };
  res.status(status).json(body);
}

/**
 * An error the client is allowed to see.
 *
 * Anything thrown that is not an `AppError` is treated as unexpected and
 * reported generically, which is what stops a stack trace or a database message
 * reaching a response (Avoid.md §4).
 */
export class AppError extends Error {
  readonly status: number;
  readonly errors: { field?: string; message: string }[];

  constructor(status: number, message: string, errors: { field?: string; message: string }[] = []) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.errors = errors;
  }
}
