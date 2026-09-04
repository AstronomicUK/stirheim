// RFC 4180 CSV reader for files we did not write (the Relic & Ruin Battle Records export, or
// anything else a GM pastes in). Tolerant on purpose: LF or CRLF line ends, a trailing newline,
// a UTF-8 byte-order mark, quoted fields with doubled quotes and embedded line breaks, and ragged
// rows (short rows are padded, long rows keep their extra cells). The writer for our own export
// lives in src/features/records/csv.ts.

/** Splits CSV text into rows of cells. Blank lines are dropped; cells are not trimmed. */
export function parseCsv(text: string, delimiter = ","): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let cellStarted = false;

  const endRow = () => {
    // A row with one empty, never-quoted cell is a blank line.
    if (row.length === 0 && cell === "" && !cellStarted) return;
    row.push(cell);
    rows.push(row);
    row = [];
    cell = "";
    cellStarted = false;
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
      cellStarted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
      cellStarted = true;
    } else if (ch === "\r") {
      if (input[i + 1] === "\n") i++;
      endRow();
    } else if (ch === "\n") {
      endRow();
    } else {
      cell += ch;
      cellStarted = true;
    }
  }
  if (cellStarted || row.length > 0 || cell !== "") endRow();
  return rows;
}

/** Picks the delimiter (comma, semicolon or tab) that appears most in the first line. */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts: [string, number][] = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0]![1] > 0 ? counts[0]![0] : ",";
}

export interface CsvRecords {
  /** Header cells, trimmed; blank headers become "column N" (1-based) so they stay addressable. */
  headers: string[];
  /** One object per data row keyed by header. Missing cells are "", extra cells are dropped. */
  rows: Record<string, string>[];
}

/**
 * Header-row CSV to records. Duplicate header names are suffixed " (2)", " (3)", … so every
 * column keeps its own key.
 */
export function csvToRecords(text: string, delimiter = detectDelimiter(text)): CsvRecords {
  const table = parseCsv(text, delimiter);
  const headerRow = table[0] ?? [];
  const seen = new Map<string, number>();
  const headers = headerRow.map((h, i) => {
    const base = h.trim() || `column ${i + 1}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  });
  const rows = table.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = cells[i] ?? "";
    });
    return record;
  });
  return { headers, rows };
}
