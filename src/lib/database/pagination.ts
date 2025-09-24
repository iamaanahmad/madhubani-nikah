import { Query } from 'appwrite';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
  meta: {
    queryTime: number;
    cacheHit: boolean;
    fromCache?: boolean;
  };
}

export interface CursorPaginationOptions {
  limit?: number;
  cursor?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
  };
  meta: {
    queryTime: number;
    cacheHit: boolean;
  };
}

export class PaginationManager {
  private static readonly DEFAULT_LIMIT = 25;
  private static readonly MAX_LIMIT = 100;
  private static readonly MIN_LIMIT = 1;

  static validatePaginationOptions(options: PaginationOptions): PaginationOptions {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(
      Math.max(this.MIN_LIMIT, options.limit || this.DEFAULT_LIMIT),
      this.MAX_LIMIT
    );

    return {
      ...options,
      page,
      limit
    };
  }

  static buildPaginationQueries(options: PaginationOptions): string[] {
    const validated = this.validatePaginationOptions(options);
    const queries: string[] = [];

    // Add limit
    queries.push(Query.limit(validated.limit!));

    // Add offset
    const offset = (validated.page! - 1) * validated.limit!;
    if (offset > 0) {
      queries.push(Query.offset(offset));
    }

    // Add ordering
    if (validated.orderBy) {
      const orderQuery = validated.orderDirection === 'desc' 
        ? Query.orderDesc(validated.orderBy)
        : Query.orderAsc(validated.orderBy);
      queries.push(orderQuery);
    }

    return queries;
  }

  static createPaginatedResult<T>(
    data: T[],
    total: number,
    options: PaginationOptions,
    queryTime: number,
    cacheHit: boolean = false
  ): PaginatedResult<T> {
    const validated = this.validatePaginationOptions(options);
    const page = validated.page!;
    const limit = validated.limit!;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      },
      meta: {
        queryTime,
        cacheHit
      }
    };
  }

  static buildCursorQueries(options: CursorPaginationOptions): string[] {
    const queries: string[] = [];
    const limit = Math.min(
      Math.max(this.MIN_LIMIT, options.limit || this.DEFAULT_LIMIT),
      this.MAX_LIMIT
    );

    queries.push(Query.limit(limit + 1)); // +1 to check if there's a next page

    if (options.cursor && options.orderBy) {
      // Cursor-based pagination using the orderBy field
      const cursorQuery = options.orderDirection === 'desc'
        ? Query.lessThan(options.orderBy, options.cursor)
        : Query.greaterThan(options.orderBy, options.cursor);
      queries.push(cursorQuery);
    }

    if (options.orderBy) {
      const orderQuery = options.orderDirection === 'desc'
        ? Query.orderDesc(options.orderBy)
        : Query.orderAsc(options.orderBy);
      queries.push(orderQuery);
    }

    return queries;
  }

  static createCursorPaginatedResult<T>(
    data: T[],
    options: CursorPaginationOptions,
    queryTime: number,
    getCursorValue: (item: T) => string,
    cacheHit: boolean = false
  ): CursorPaginatedResult<T> {
    const limit = Math.min(
      Math.max(this.MIN_LIMIT, options.limit || this.DEFAULT_LIMIT),
      this.MAX_LIMIT
    );

    const hasNextPage = data.length > limit;
    const actualData = hasNextPage ? data.slice(0, limit) : data;

    const nextCursor = hasNextPage && actualData.length > 0
      ? getCursorValue(actualData[actualData.length - 1])
      : null;

    const prevCursor = options.cursor || null;

    return {
      data: actualData,
      pagination: {
        limit,
        hasNextPage,
        hasPrevPage: !!options.cursor,
        nextCursor,
        prevCursor
      },
      meta: {
        queryTime,
        cacheHit
      }
    };
  }

  // Optimized pagination for large datasets
  static async paginateWithCount<T>(
    executeQuery: (queries: string[]) => Promise<{ documents: T[]; total: number }>,
    baseQueries: string[],
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const startTime = Date.now();
    const paginationQueries = this.buildPaginationQueries(options);
    const allQueries = [...baseQueries, ...paginationQueries];

    const result = await executeQuery(allQueries);
    const queryTime = Date.now() - startTime;

    return this.createPaginatedResult(
      result.documents,
      result.total,
      options,
      queryTime
    );
  }

  // Cursor-based pagination for real-time data
  static async paginateWithCursor<T>(
    executeQuery: (queries: string[]) => Promise<{ documents: T[] }>,
    baseQueries: string[],
    options: CursorPaginationOptions,
    getCursorValue: (item: T) => string
  ): Promise<CursorPaginatedResult<T>> {
    const startTime = Date.now();
    const cursorQueries = this.buildCursorQueries(options);
    const allQueries = [...baseQueries, ...cursorQueries];

    const result = await executeQuery(allQueries);
    const queryTime = Date.now() - startTime;

    return this.createCursorPaginatedResult(
      result.documents,
      options,
      queryTime,
      getCursorValue
    );
  }

  // Generate pagination metadata for UI components
  static generatePaginationMeta(pagination: PaginatedResult<any>['pagination']): {
    showingFrom: number;
    showingTo: number;
    showingText: string;
    pageNumbers: number[];
    showFirstLast: boolean;
  } {
    const { page, limit, total, totalPages } = pagination;
    const showingFrom = Math.min((page - 1) * limit + 1, total);
    const showingTo = Math.min(page * limit, total);
    
    const showingText = total === 0 
      ? 'No results found'
      : `Showing ${showingFrom}-${showingTo} of ${total} results`;

    // Generate page numbers for pagination UI (show 5 pages around current)
    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);
    
    let startPage = Math.max(1, page - halfRange);
    let endPage = Math.min(totalPages, page + halfRange);
    
    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxPagesToShow) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return {
      showingFrom,
      showingTo,
      showingText,
      pageNumbers,
      showFirstLast: totalPages > maxPagesToShow
    };
  }

  // Calculate optimal page size based on data characteristics
  static calculateOptimalPageSize(
    averageItemSize: number,
    targetResponseTime: number = 1000,
    maxMemoryUsage: number = 5 * 1024 * 1024 // 5MB
  ): number {
    // Estimate based on memory constraints
    const memoryBasedLimit = Math.floor(maxMemoryUsage / averageItemSize);
    
    // Estimate based on response time (rough calculation)
    const timeBasedLimit = Math.floor(targetResponseTime / 10); // Assume 10ms per item processing
    
    // Use the more conservative limit
    const calculatedLimit = Math.min(memoryBasedLimit, timeBasedLimit);
    
    // Ensure it's within our bounds
    return Math.min(
      Math.max(this.MIN_LIMIT, calculatedLimit),
      this.MAX_LIMIT
    );
  }

  // Performance analysis for pagination queries
  static analyzePaginationPerformance(
    results: PaginatedResult<any>[],
    timeWindow: number = 3600000 // 1 hour
  ): {
    averageQueryTime: number;
    slowestQuery: number;
    fastestQuery: number;
    cacheHitRate: number;
    recommendedPageSize: number;
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  } {
    const now = Date.now();
    const recentResults = results.filter(r => 
      now - (r.meta.queryTime || 0) < timeWindow
    );

    if (recentResults.length === 0) {
      return {
        averageQueryTime: 0,
        slowestQuery: 0,
        fastestQuery: 0,
        cacheHitRate: 0,
        recommendedPageSize: this.DEFAULT_LIMIT,
        performanceGrade: 'F'
      };
    }

    const queryTimes = recentResults.map(r => r.meta.queryTime);
    const averageQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
    const slowestQuery = Math.max(...queryTimes);
    const fastestQuery = Math.min(...queryTimes);
    
    const cacheHits = recentResults.filter(r => r.meta.cacheHit).length;
    const cacheHitRate = cacheHits / recentResults.length;

    // Calculate recommended page size based on performance
    let recommendedPageSize = this.DEFAULT_LIMIT;
    if (averageQueryTime > 2000) {
      recommendedPageSize = Math.max(10, Math.floor(this.DEFAULT_LIMIT * 0.6));
    } else if (averageQueryTime < 500) {
      recommendedPageSize = Math.min(this.MAX_LIMIT, Math.floor(this.DEFAULT_LIMIT * 1.5));
    }

    // Performance grading
    let performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (averageQueryTime < 500 && cacheHitRate > 0.8) {
      performanceGrade = 'A';
    } else if (averageQueryTime < 1000 && cacheHitRate > 0.6) {
      performanceGrade = 'B';
    } else if (averageQueryTime < 2000 && cacheHitRate > 0.4) {
      performanceGrade = 'C';
    } else if (averageQueryTime < 3000) {
      performanceGrade = 'D';
    }

    return {
      averageQueryTime,
      slowestQuery,
      fastestQuery,
      cacheHitRate,
      recommendedPageSize,
      performanceGrade
    };
  }
}