import { PaginatedResult } from '@/common/interfaces';

export class PaginationUtil {
  static createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}