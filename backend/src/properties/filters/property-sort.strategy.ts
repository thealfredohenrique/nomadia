import { Property } from '../../common/types';

type SortFn = (a: Property, b: Property) => number;

export const SORT_STRATEGIES: Record<string, SortFn> = {
  price_asc: (a, b) => a.pricePerNight - b.pricePerNight,
  price_desc: (a, b) => b.pricePerNight - a.pricePerNight,
  rating: (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
  reviews: (a, b) => b.totalReviews - a.totalReviews,
  default: (a, b) => b.viewsCount - a.viewsCount,
};

export function sortProperties(
  properties: Property[],
  sortBy?: string,
): Property[] {
  const strategy =
    SORT_STRATEGIES[sortBy || 'default'] || SORT_STRATEGIES.default;
  return [...properties].sort(strategy);
}
