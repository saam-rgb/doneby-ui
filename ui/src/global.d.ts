/* SheetJS (xlsx) is loaded from a CDN <script> in index.html and attached to window.
   Minimal typing for the bits Lumen uses for Excel export/import. */

interface XLSXUtils {
  json_to_sheet(data: Record<string, unknown>[]): XLSXWorkSheet;
  sheet_to_json<T = Record<string, unknown>>(ws: XLSXWorkSheet): T[];
  book_new(): XLSXWorkBook;
  book_append_sheet(wb: XLSXWorkBook, ws: XLSXWorkSheet, name: string): void;
}

interface XLSXWorkSheet {
  "!cols"?: { wch: number }[];
  [k: string]: unknown;
}

interface XLSXWorkBook {
  SheetNames: string[];
  Sheets: Record<string, XLSXWorkSheet>;
}

interface XLSXStatic {
  utils: XLSXUtils;
  read(data: ArrayBuffer | string, opts: { type: string }): XLSXWorkBook;
  writeFile(wb: XLSXWorkBook, filename: string): void;
}

interface Window {
  XLSX?: XLSXStatic;
}
