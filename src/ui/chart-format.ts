/**
 * Colours for one line per series, in this fixed order. They are not the muted
 * Pylon tokens: those sit too close together to tell lines apart (checked with the
 * palette validator on the card surface #12141a; this set passes for colour-blind and
 * normal vision). A series keeps its colour by its position, so
 * removing one does not repaint the others. Past eight, lines are drawn in grey.
 */
export const SERIES_COLORS = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
] as const;

const OVERFLOW_COLOR = "#8b909c";

export function seriesColor(index: number): string {
  return SERIES_COLORS[index] ?? OVERFLOW_COLOR;
}

export function clockTime(ts: number, withSeconds = true): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
    hour12: false,
  });
}

/** The time ranges a chart page offers. */
export const RANGES = [
  { id: "5m", label: "5 min", seconds: 300 },
  { id: "15m", label: "15 min", seconds: 900 },
  { id: "1h", label: "1 hour", seconds: 3600 },
] as const;

export type RangeId = (typeof RANGES)[number]["id"];
