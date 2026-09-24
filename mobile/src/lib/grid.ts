import { Dimensions } from 'react-native';
import { semanticSpacing } from '../theme/spacing';

export interface GridMetrics {
  screenWidth: number;
  /** Horizontal screen edge padding (16). */
  screenPadding: number;
  /** Gutter between cards (8). */
  gap: number;
  /** Exact width of one 2-col grid card. Single source of truth so grid and
   *  carousel cards are pixel-identical. */
  columnWidth: number;
}

/**
 * 2-col product grid geometry, computed from the window width.
 * Every product surface (Browse grid, Home New Arrivals, Favorites, Search
 * results, Sale page, carousels) derives its card size from here — this is
 * what keeps card widths consistent across the app.
 */
export function getGridMetrics(
  screenWidth: number = Dimensions.get('window').width,
): GridMetrics {
  const screenPadding = semanticSpacing.screenPadding;
  const gap = semanticSpacing.inlineGap;
  const columnWidth = (screenWidth - screenPadding * 2 - gap) / 2;
  return { screenWidth, screenPadding, gap, columnWidth };
}
