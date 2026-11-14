/**
 * Centralized, theme-aware colors for Chart.js so no chart uses the default palette.
 * Ensures readable colors in both light and dark mode.
 */
import type { ChartData, ChartDataset } from 'chart.js/auto';

const BLUE         = 'rgb(54, 162, 235)';
const RED          = 'rgb(255, 99, 132)';
const ORANGE       = 'rgb(255, 159, 64)';
const PURPLE       = 'rgb(153, 102, 255)';

/** Semantic colors for the four solve-timing segments. */
export const SEGMENT_COLORS = {
    recognition: BLUE,
    preAuf:      PURPLE,
    execution:   RED,
    postAuf:     ORANGE,
} as const;

/** Colors for chart axis grid lines and tick labels in dark mode. */
export const DARK_AXIS_COLORS = {
    grid:  'rgba(255,255,255,0.15)',
    label: 'rgba(255,255,255,0.8)',
} as const;

export type ChartColorPair = { borderColor: string; backgroundColor: string };

function makePalette(colors: string[]): ChartColorPair[] {
    return colors.map(borderColor => ({
        borderColor,
        backgroundColor: borderColor.replace('rgb(', 'rgba(').replace(')', ', 0.8)'),
    }));
}

/** Theme-aware palette: at least 12 colors readable on light and dark backgrounds. */
const LIGHT_PALETTE = makePalette([
    BLUE, RED, 'rgb(75, 192, 192)', ORANGE, PURPLE, 'rgb(255, 205, 86)',
    'rgb(0, 180, 180)', 'rgb(220, 100, 180)', 'rgb(100, 160, 100)',
    'rgb(230, 120, 80)', 'rgb(120, 140, 220)', 'rgb(180, 180, 80)',
]);

/** Dark mode: same hues, higher luminance for readability on dark background. */
const DARK_PALETTE = makePalette([
    'rgb(100, 200, 255)', 'rgb(255, 130, 160)', 'rgb(100, 220, 220)',
    'rgb(255, 190, 120)', 'rgb(190, 150, 255)', 'rgb(255, 230, 150)',
    'rgb(80, 220, 220)', 'rgb(255, 150, 220)', 'rgb(150, 220, 150)',
    'rgb(255, 160, 120)', 'rgb(160, 180, 255)', 'rgb(220, 220, 140)',
]);

function getPalette(isDark: boolean): ChartColorPair[] {
    return isDark ? DARK_PALETTE : LIGHT_PALETTE;
}

/**
 * Chart.js colour fields are "scriptable": besides a colour string they may hold a
 * gradient, a pattern, a per-point array or a callback. The palette only needs to know
 * whether one was set at all, so the concrete dataset type is used and not re-declared.
 */
function hasOwnColor(dataset: ChartDataset<'line' | 'bar' | 'doughnut'>): boolean {
    return (
        ('borderColor' in dataset && dataset.borderColor !== undefined && dataset.borderColor !== null) ||
        ('backgroundColor' in dataset && dataset.backgroundColor !== undefined && dataset.backgroundColor !== null)
    );
}

/**
 * Applies the theme-aware palette to any dataset that does not already define
 * borderColor/backgroundColor. Preserves semantic colors (e.g. cross colors, OLL/PLL markers).
 * @param perPointColors - When true (e.g. for doughnut/pie), assign an array of colors, one per data point, so each segment has a different color.
 */
export function applyPaletteToChartData<T extends 'line' | 'bar' | 'doughnut', TData, TLabel>(
    data: ChartData<T, TData, TLabel>,
    isDark: boolean,
    perPointColors?: boolean
): ChartData<T, TData, TLabel> {
    if (!data?.datasets?.length) return data;
    const palette = getPalette(isDark);
    const datasets = data.datasets.map((ds, dsIndex) => {
        if (hasOwnColor(ds as ChartDataset<'line' | 'bar' | 'doughnut'>)) return ds;
        const dataLength = Array.isArray(ds.data) ? ds.data.length : 0;
        if (perPointColors && dataLength > 0) {
            const colors = Array.from({ length: dataLength }, (_, i) => palette[(dsIndex * 4 + i) % palette.length]);
            return {
                ...ds,
                backgroundColor: colors.map(color => color.backgroundColor),
                borderColor: colors.map(color => color.borderColor),
            };
        }
        const color = palette[dsIndex % palette.length];
        return {
            ...ds,
            borderColor: color.borderColor,
            backgroundColor: color.backgroundColor,
        };
    });
    return { ...data, datasets };
}
