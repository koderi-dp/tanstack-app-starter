import { expect, it } from "vitest";
import { clockTime, seriesColor, SERIES_COLORS } from "./chart-format";

it("keeps a series' colour by its position and greys the overflow", () => {
  expect(seriesColor(0)).toBe(SERIES_COLORS[0]);
  expect(seriesColor(SERIES_COLORS.length - 1)).toBe(SERIES_COLORS[SERIES_COLORS.length - 1]);
  expect(seriesColor(SERIES_COLORS.length)).toBe("#8b909c");
  expect(seriesColor(99)).toBe("#8b909c");
});

it("names the same series differently, so two lines are never one colour", () => {
  expect(new Set(SERIES_COLORS).size).toBe(SERIES_COLORS.length);
});

it("draws a clock time in 24 hours, with seconds only when asked", () => {
  const ts = new Date(2026, 0, 2, 9, 5, 7).getTime();
  expect(clockTime(ts)).toBe("09:05:07");
  expect(clockTime(ts, false)).toBe("09:05");
});
