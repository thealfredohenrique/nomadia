import { PaginatedResponse } from './types';
import { DEFAULT_PAGE_LIMIT } from './constants';

export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = DEFAULT_PAGE_LIMIT,
): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return { data, pagination: { page, limit, total, totalPages } };
}
