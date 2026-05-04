import * as xlsx from "xlsx";

export interface CellView {
  display: string;
  colspan: number;
  rowspan: number;
  hidden: boolean;
  style: { [k: string]: string };
}

/**
 * Дефолтная палитра темы Office 2013+ (актуальная для Excel 2013+/
 * LibreOffice/Google Sheets — большинство современных xlsx-файлов).
 * Используется как fallback, когда для cell.s.fgColor пришёл
 * { theme: N } без разрешения в RGB.
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
  const clamped = Math.max(0, Math.min(255, Math.round(v)));
  const h = clamped.toString(16);
  return h.length < 2 ? "0" + h : h;
};

const tintColor = (hex: string, tint: number): string => {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const apply = (v: number): number =>
    tint < 0 ? v * (1 + tint) : v + (255 - v) * tint;
  return toHex(apply(r)) + toHex(apply(g)) + toHex(apply(b));
};

export const resolveColor = (c: any): string | null => {
  if (!c) return null;
  let hex: string | null = null;
  if (typeof c.rgb === "string" && c.rgb.length >= 6) {
    hex = c.rgb.length === 8 ? c.rgb.substring(2) : c.rgb;
  } else if (typeof c.theme === "number") {
    hex = OFFICE_THEME_RGB[c.theme] || null;
  } else if (typeof c.indexed === "number") {
    hex = INDEXED_PALETTE[c.indexed] || null;
  }
  if (!hex) return null;
  if (typeof c.tint === "number" && c.tint !== 0) {
    hex = tintColor(hex, c.tint);
  }
  return "#" + hex.toUpperCase();
};

const toNumberId = (...candidates: any[]): number | undefined => {
  for (const c of candidates) {
    if (c === undefined || c === null || c === "") continue;
    const n = typeof c === "number" ? c : Number(c);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

const isFontObject = (o: any): boolean =>
  !!o &&
  typeof o === "object" &&
  ("name" in o || "bold" in o || "sz" in o || "color" in o || "italic" in o);

const isBorderObject = (o: any): boolean =>
  !!o &&
  typeof o === "object" &&
  ("top" in o || "bottom" in o || "left" in o || "right" in o);

/**
 * В community SheetJS при cellStyles:true cell.s — это запись CellXf
 * (со ссылками fontId/fillId/borderId), а не разрешённый объект.
 * Часть полей дублируется в lowercase (fontid/fillid/borderid) — учитываем оба.
 * На всякий случай поддерживаем и уже-разрешённую форму (s.font/s.fgColor).
 */
export const buildCellStyle = (
  s: any,
  styles: any,
): { [k: string]: string } => {
  const out: { [k: string]: string } = {};
  if (!s) return out;

  const fonts = (styles && styles.Fonts) || [];
  const fills = (styles && styles.Fills) || [];
  const borders = (styles && styles.Borders) || [];

  const fontId = toNumberId(s.fontId, s.fontid);
  const fillId = toNumberId(s.fillId, s.fillid);
  const borderId = toNumberId(s.borderId, s.borderid);

  const font = isFontObject(s.font)
    ? s.font
    : fontId !== undefined
    ? fonts[fontId]
    : undefined;
  const fill =
    s.patternType !== undefined
      ? s
      : fillId !== undefined
      ? fills[fillId]
      : undefined;
  const border = isBorderObject(s.border)
    ? s.border
    : borderId !== undefined
    ? borders[borderId]
    : undefined;

  if (fill && fill.patternType === "solid" && fill.fgColor) {
    const bg = resolveColor(fill.fgColor);
    if (bg) out["background-color"] = bg;
  }

  if (font) {
    if (font.bold) out["font-weight"] = "bold";
    if (font.italic) out["font-style"] = "italic";
    if (font.underline) out["text-decoration"] = "underline";
    if (font.sz) out["font-size"] = font.sz + "pt";
    if (font.name) out["font-family"] = "\"" + font.name + "\", sans-serif";
    const fc = resolveColor(font.color);
    if (fc) out["color"] = fc;
  }

  if (s.alignment) {
    if (s.alignment.horizontal) out["text-align"] = s.alignment.horizontal;
    if (s.alignment.vertical) {
      out["vertical-align"] =
        s.alignment.vertical === "center" ? "middle" : s.alignment.vertical;
    }
    if (s.alignment.wrapText) out["white-space"] = "normal";
  }

  if (border) {
    (["top", "right", "bottom", "left"] as Array<
      "top" | "right" | "bottom" | "left"
    >).forEach((side) => {
      const b = border[side];
      if (b && b.style && b.style !== "none") {
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
  if (cell.w !== undefined) return cell.w;
  if (cell.v !== undefined) return String(cell.v);
  return "";
};

export const buildRows = (sheet: any, styles: any): CellView[][] => {
  if (!sheet || !sheet["!ref"]) return [];
  const range = xlsx.utils.decode_range(sheet["!ref"]);
  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = sheet["!merges"] || [];

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
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: CellView[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
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
      const addr = xlsx.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      const a = anchors[key];
      row.push({
        display: cellDisplay(cell),
        colspan: a ? a.colspan : 1,
        rowspan: a ? a.rowspan : 1,
        hidden: false,
        style: cell ? buildCellStyle(cell.s, styles) : {},
      });
    }
    rows.push(row);
  }
  return rows;
};
