/**
 * Escapes a single CSV cell against formula injection (a leading =, +, -, @,
 * tab, or CR that spreadsheet apps interpret as a formula) by prefixing
 * with a literal quote-apostrophe, and against the field separator/quotes
 * themselves via standard CSV quoting.
 */
export function escapeCsvCell(value: unknown): string {
  let str = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return "﻿" + lines.join("\r\n"); // BOM so Excel opens Arabic text as UTF-8 correctly
}
