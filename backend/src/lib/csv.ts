/**
 * RFC 4180 CSV, for exports opened in a spreadsheet.
 *
 * A cell that begins with `=`, `+`, `-` or `@` is prefixed with an apostrophe:
 * a spreadsheet would otherwise evaluate it as a formula, and a category name
 * is administrator-entered text (CSV injection, OWASP).
 */
function cell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T extends Record<string, string | number | null>>(columns: { key: keyof T; header: string }[], rows: T[]): string {
  const lines = [columns.map((column) => cell(column.header)).join(",")];

  for (const row of rows) {
    lines.push(columns.map((column) => cell(row[column.key])).join(","));
  }

  /* A byte-order mark, so Excel opens it as UTF-8 and "Hi Mum" em dashes survive. */
  return `﻿${lines.join("\r\n")}\r\n`;
}
