import { describe, expect, it } from "vitest";
import { csvToRecords, detectDelimiter, parseCsv } from "../csv";

describe("parseCsv", () => {
  it("splits plain rows on commas and LF", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("accepts CRLF, a trailing newline and blank lines", () => {
    expect(parseCsv("a,b\r\n1,2\r\n\r\n3,4\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("strips a UTF-8 byte-order mark", () => {
    expect(parseCsv("﻿match,date\nx,y")).toEqual([
      ["match", "date"],
      ["x", "y"],
    ]);
  });

  it("handles quoted fields with commas, doubled quotes and line breaks", () => {
    const text = 'name,notes\n"Reikland, Watch","He said ""run""\nthen fled",tail\n';
    expect(parseCsv(text)).toEqual([
      ["name", "notes"],
      ["Reikland, Watch", 'He said "run"\nthen fled', "tail"],
    ]);
  });

  it("keeps empty cells, including a trailing one, and a quoted empty cell", () => {
    expect(parseCsv("a,,c\n1,2,\n\"\"")).toEqual([
      ["a", "", "c"],
      ["1", "2", ""],
      [""],
    ]);
  });

  it("does not trim cell whitespace", () => {
    expect(parseCsv(" a , b ")).toEqual([[" a ", " b "]]);
  });

  it("returns nothing for empty input", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("\n\n")).toEqual([]);
  });

  it("takes another delimiter", () => {
    expect(parseCsv("a;b\n1;2", ";")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("detectDelimiter", () => {
  it("picks the most frequent of comma, semicolon and tab on the first line", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
    expect(detectDelimiter("single")).toBe(",");
  });
});

describe("csvToRecords", () => {
  it("keys rows by trimmed header and pads short rows", () => {
    const { headers, rows } = csvToRecords(" Match ,Date,Warband\nm1,2026-08-31,Reikland Watch\nm2,2026-09-01\n");
    expect(headers).toEqual(["Match", "Date", "Warband"]);
    expect(rows).toEqual([
      { Match: "m1", Date: "2026-08-31", Warband: "Reikland Watch" },
      { Match: "m2", Date: "2026-09-01", Warband: "" },
    ]);
  });

  it("names blank and duplicate headers so every column stays addressable", () => {
    const { headers, rows } = csvToRecords("warband,,warband\na,b,c");
    expect(headers).toEqual(["warband", "column 2", "warband (2)"]);
    expect(rows[0]).toEqual({ warband: "a", "column 2": "b", "warband (2)": "c" });
  });

  it("drops cells beyond the header row", () => {
    const { rows } = csvToRecords("a,b\n1,2,3");
    expect(rows).toEqual([{ a: "1", b: "2" }]);
  });

  it("is empty for a header-only or blank file", () => {
    expect(csvToRecords("a,b\n")).toEqual({ headers: ["a", "b"], rows: [] });
    expect(csvToRecords("")).toEqual({ headers: [], rows: [] });
  });

  it("auto-detects semicolon-separated files", () => {
    const { headers, rows } = csvToRecords("a;b\n1;2");
    expect(headers).toEqual(["a", "b"]);
    expect(rows).toEqual([{ a: "1", b: "2" }]);
  });
});
