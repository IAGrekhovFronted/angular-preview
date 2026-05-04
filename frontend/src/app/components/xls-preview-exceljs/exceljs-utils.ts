export interface CellView {
  display: string;
  colspan: number;
  rowspan: number;
  hidden: boolean;
  style: { [k: string]: string };
}

/**
 * Excel может хранить цвета не напрямую (HEX), а через ссылки:
 * - theme — индекс цвета из темы (OFFICE_THEME_RGB)
 * - indexed — индекс из стандартной палитры (INDEXED_PALETTE)
 * Эти мапы нужны, чтобы преобразовать такие ссылки в реальные HEX-цвета для CSS.
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

/**
 * Преобразование стилей ячейки из формата ExcelJS в CSS-стили для рендера таблицы
 * фон (fill)
 * шрифт (font)
 * выравнивание (alignment)
 * границы (border)
 */
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

/**
 * Хелпер для извлечени значения из ячейки с учетом разных типов данных и формул
 */
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

/**
 * Преобразование буквенных обозначений колонок в числовое представление
 */
const colLetterToIndex = (s: string): number => {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    /**
     * 26 - количество букв в английском алфавите. Умножаем на 26, чтобы сдвинуть разряд влево, и добавляем значение текущей буквы.
     * Например, для "AB": сначала n = 0 * 26 + (1) = 1, затем n = 1 * 26 + (2) = 28, что соответствует колонке AB
     * charCodeAt для 'A' возвращает 65, для 'B' - 66 и так далее. Вычитаем 64, чтобы 'A' стало 1, 'B' - 2 и так далее
     */
    n = n * 26 + (s.charCodeAt(i) - 64);
  }
  return n;
};

/**
 * Преобразуем адреса ячеек и диапазонов из формата Excel (например, "B2" или "C3:D5") в координаты { r: number; c: number }.
 */
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

/**
 * Ищем colspan и rowspan
 */
const collectMerges = (ws: any) => {
  /**
   * ws.model.merges - массив строковых диапазонов, например ["B2:D5", "F1:F3"].
   * Если его нет, значит на листе нет объединенных ячеек — возвращаем пустой массив.
   */
  const model = ws.model;
  const merges = model && model.merges;

  if (!Array.isArray(merges)) return [];

  return merges.map(parseRange).filter((p): p is NonNullable<typeof p> => !!p);
};

export const buildRowsFromExceljs = (ws: any): CellView[][] => {
  if (!ws) return [];
  /**
   * dimensions - это координаты прямоугольной области, в которой есть данные на листе Excel
   * Например, координаты ячеек в Excel B2:D5 будут иметь dimensions { top: 2, left: 2, bottom: 5, right: 4 }
   * С помощью координат задаем границы обхода таблицы. Если dimensions нет, значит лист пустой — возвращаем пустой массив.
   */
  const dim = ws.dimensions;
  if (!dim) return [];

  const top = dim.top || 1;
  const left = dim.left || 1;
  const bottom = dim.bottom || top;
  const right = dim.right || left;

  /**
   * Получаем числовые координаты объединенных ячеек на листе Excel
   */
  const merges = collectMerges(ws);

  // covered - множество координат ячеек, которые покрыты объединением (кроме верхней левой ячейки объединения)
  const covered = new Set<string>();

  /**
   * anchors - координаты верхних левых ячеек объединений, сопоставленных с их colspan и rowspan
   * Например,
   * [ B2 ][ C2 ][ D2 ]
   * [ B3 ][ C3 ][ D3 ]
   *
   * anchors["2,2"] = { colspan: 3, rowspan: 2 }
   */
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

  /**
   * Построение матрицы для рендера таблицы
   */
  const rows: CellView[][] = [];
  // Проходимся по всем строкам
  for (let r = top; r <= bottom; r++) {
    const wsRow = ws.getRow(r);
    const row: CellView[] = [];
    // Проходимся по всем колонкам
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

      /**
       * API либы
       * Получаем объект ячейки по номеру. Он может содержать свойства value, text, fill, font, alignment, border и другие.
       */
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
