export interface CellView {
  display: string;
  colspan: number;
  rowspan: number;
  hidden: boolean;
  style: { [k: string]: string };
}

/**
 * exceljs не разворачивает theme1.xml в палитру — цвета приходят
 * как { theme: N, tint?: T }. Используем дефолтную палитру Office 2013+
 * (актуальная для Excel 2013+/LibreOffice/Google Sheets — большинство файлов).
 * Индексы 0/1 и 2/3 в OOXML переставлены относительно порядка в clrScheme.
 */
const OFFICE_THEME_RGB = [
  "FFFFFF", // 0 lt1
  "000000", // 1 dk1
  "E7E6E6", // 2 lt2
  "44546A", // 3 dk2
  "5B9BD5", // 4 accent1
  "ED7D31", // 5 accent2
  "A5A5A5", // 6 accent3
  "FFC000", // 7 accent4
  "4472C4", // 8 accent5
  "70AD47", // 9 accent6
  "0563C1", // 10 hlink
  "954F72", // 11 folHlink
];

const INDEXED_PALETTE: { [k: number]: string } = {
  0: "000000",
  1: "FFFFFF",
  2: "FF0000",
  3: "00FF00",
  4: "0000FF",
  5: "FFFF00",
  6: "FF00FF",
  7: "00FFFF",
  8: "000000",
  9: "FFFFFF",
  10: "FF0000",
  11: "00FF00",
  12: "0000FF",
  13: "FFFF00",
  14: "FF00FF",
  15: "00FFFF",
  64: "000000",
  65: "FFFFFF",
};

const BORDER_STYLE_MAP: { [k: string]: string } = {
  thin: "1px solid",
  medium: "2px solid",
  thick: "3px solid",
  dashed: "1px dashed",
  dotted: "1px dotted",
  double: "3px double",
  hair: "1px solid",
  mediumDashed: "2px dashed",
  dashDot: "1px dashed",
  mediumDashDot: "2px dashed",
};

const toHex = (v: number): string => {
  const c = Math.max(0, Math.min(255, Math.round(v))).toString(16);
  return c.length < 2 ? "0" + c : c;
};

const tintColor = (hex: string, tint: number): string => {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const apply = (v: number): number =>
    tint < 0 ? v * (1 + tint) : v + (255 - v) * tint;
  return toHex(apply(r)) + toHex(apply(g)) + toHex(apply(b));
};

const argbToHex = (argb: string): string => {
  const h = argb.length === 8 ? argb.substring(2) : argb;
  return h.toUpperCase();
};

const resolveColor = (color: any): string | null => {
  if (!color) return null;
  let hex: string | null = null;
  if (typeof color.argb === "string" && color.argb.length >= 6) {
    hex = argbToHex(color.argb);
  } else if (typeof color.theme === "number") {
    hex = OFFICE_THEME_RGB[color.theme] || null;
  } else if (typeof color.indexed === "number") {
    hex = INDEXED_PALETTE[color.indexed] || null;
  }
  if (!hex) return null;
  if (typeof color.tint === "number" && color.tint !== 0) {
    hex = tintColor(hex, color.tint);
  }
  return "#" + hex.toUpperCase();
};

const buildCellStyle = (cell: any): { [k: string]: string } => {
  const out: { [k: string]: string } = {};
  if (!cell) return out;

  const fill = cell.fill;
  if (fill && fill.type === "pattern" && fill.pattern === "solid") {
    const c = resolveColor(fill.fgColor);
    if (c) out["background-color"] = c;
  }

  const font = cell.font;
  if (font) {
    if (font.bold) out["font-weight"] = "bold";
    if (font.italic) out["font-style"] = "italic";
    if (font.underline) out["text-decoration"] = "underline";
    if (font.size) out["font-size"] = font.size + "pt";
    if (font.name) out["font-family"] = '"' + font.name + '", sans-serif';
    const c = resolveColor(font.color);
    if (c) out["color"] = c;
  }

  const align = cell.alignment;
  if (align) {
    if (align.horizontal) out["text-align"] = align.horizontal;
    if (align.vertical) {
      out["vertical-align"] =
        align.vertical === "middle" ? "middle" : align.vertical;
    }
    if (align.wrapText) out["white-space"] = "normal";
  }

  const border = cell.border;
  if (border) {
    (
      ["top", "right", "bottom", "left"] as Array<
        "top" | "right" | "bottom" | "left"
      >
    ).forEach((side) => {
      const b = border[side];
      if (b && b.style) {
        const css = BORDER_STYLE_MAP[b.style] || "1px solid";
        const col = resolveColor(b.color) || "#000000";
        out["border-" + side] = css + " " + col;
      }
    });
  }

  return out;
};

const cellDisplay = (cell: any): string => {
  if (!cell) return "";
  if (cell.text !== undefined && cell.text !== null && cell.text !== "") {
    return String(cell.text);
  }
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (Array.isArray(v.richText)) {
      return v.richText.map((p: any) => p.text || "").join("");
    }
    if (v.result !== undefined) return String(v.result);
    if (v.text !== undefined) return String(v.text);
    return "";
  }
  return String(v);
};

const colLetterToIndex = (s: string): number => {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    n = n * 26 + (s.charCodeAt(i) - 64);
  }
  return n;
};

const parseAddress = (addr: string): { r: number; c: number } | null => {
  const m = /^([A-Z]+)(\d+)$/.exec(addr);
  if (!m) return null;
  return { c: colLetterToIndex(m[1]), r: parseInt(m[2], 10) };
};

const parseRange = (
  range: string,
): { s: { r: number; c: number }; e: { r: number; c: number } } | null => {
  const parts = range.split(":");
  if (parts.length !== 2) return null;
  const s = parseAddress(parts[0]);
  const e = parseAddress(parts[1]);
  if (!s || !e) return null;
  return { s, e };
};

const collectMerges = (
  ws: any,
): Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> => {
  const out: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = [];

  const fromModel: string[] =
    (ws.model && Array.isArray(ws.model.merges) && ws.model.merges) || [];
  for (const r of fromModel) {
    const p = parseRange(r);
    if (p) out.push(p);
  }
  if (out.length) return out;

  const internal = ws._merges;
  if (internal && typeof internal === "object") {
    for (const k of Object.keys(internal)) {
      const m = internal[k];
      const range =
        (m && (m.range || (m.tl && m.br ? m.tl + ":" + m.br : null))) || k;
      const p = parseRange(range);
      if (p) out.push(p);
    }
  }
  return out;
};

export const buildRowsFromExceljs = (ws: any): CellView[][] => {
  if (!ws) return [];
  const dim = ws.dimensions;
  if (!dim) return [];

  const top = dim.top || 1;
  const left = dim.left || 1;
  const bottom = dim.bottom || top;
  const right = dim.right || left;

  const merges = collectMerges(ws);
  const covered = new Set<string>();
  const anchors: { [k: string]: { colspan: number; rowspan: number } } = {};
  for (const m of merges) {
    anchors[m.s.r + "," + m.s.c] = {
      colspan: m.e.c - m.s.c + 1,
      rowspan: m.e.r - m.s.r + 1,
    };
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        if (r === m.s.r && c === m.s.c) continue;
        covered.add(r + "," + c);
      }
    }
  }

  const rows: CellView[][] = [];
  for (let r = top; r <= bottom; r++) {
    const wsRow = ws.getRow(r);
    const row: CellView[] = [];
    for (let c = left; c <= right; c++) {
      const key = r + "," + c;
      if (covered.has(key)) {
        row.push({
          display: "",
          colspan: 1,
          rowspan: 1,
          hidden: true,
          style: {},
        });
        continue;
      }
      const cell = wsRow.getCell(c);
      const a = anchors[key];
      row.push({
        display: cellDisplay(cell),
        colspan: a ? a.colspan : 1,
        rowspan: a ? a.rowspan : 1,
        hidden: false,
        style: buildCellStyle(cell),
      });
    }
    rows.push(row);
  }
  return rows;
};
