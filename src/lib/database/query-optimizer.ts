import { Query } from 'appwrite';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: QueryFilter[];
  search?: string;
  searchFields?: string[];
}

export interface QueryFilter {
  field: string;
  operator: 'equal' | 'notEqual' | 'lessThan' | 'lessThanEqual' | 'greaterThan' | 'greaterThanEqual' | 'contains' | 'startsWith' | 'endsWith' | 'isNull' | 'isNotNull' | 'between' | 'in';
  value: any;
  secondValue?: any; // For 'between' operator
}

export interface PaginationResult<T> {
  documents: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface QueryPerformanceMetrics {
  queryTime: number;
  resultCount: number;
  cacheHit: boolean;
  indexesUsed: string[];
  optimizationSuggestions: string[];
}

export class QueryOptimizer {
  private static readonly DEFAULT_LIMIT = 25;
  private static readonly MAX_LIMIT = 100;
  private static readonly PERFORMANCE_THRESHOLD_MS = 1000;

  static buildQuery(options: QueryOptions): string[] {
    const queries: string[] = [];

    // Add filters
    if (options.filters) {
      options.filters.forEach(filter => {
        const query = this.buildFilterQuery(filter);
        if (query) queries.push(query);
      });
    }

    // Add search
    if (options.search && options.searchFields) {
      const searchQueries = this.buildSearchQuery(options.search, options.searchFields);
      queries.push(...searchQueries);
    }

    // Add pagination
    const limit = Math.min(options.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    queries.push(Query.limit(limit));

    if (options.offset) {
      queries.push(Query.offset(options.offset));
    }

    // Add ordering
    if (options.orderBy) {
      const direction = options.orderDirection === 'desc' ? Query.orderDesc : Query.orderAsc;
      queries.push(direction(options.orderBy));
    }

    return queries;
  }

  private static buildFilterQuery(filter: QueryFilter): string | null {
    const { field, operator, value, secondValue } = filter;

    switch (operator) {
      case 'equal':
        return Query.equal(field, value);
      case 'notEqual':
        return Query.notEqual(field, value);
      case 'lessThan':
        return Query.lessThan(field, value);
      case 'lessThanEqual':
        return Query.lessThanEqual(field, value);
      case 'greaterThan':
        return Query.greaterThan(field, value);
      case 'greaterThanEqual':
        return Query.greaterThanEqual(field, value);
      case 'contains':
        return Query.search(field, value);
      case 'startsWith':
        return Query.startsWith(field, value);
      case 'endsWith':
        return Query.endsWith(field, value);
      case 'isNull':
        return Query.isNull(field);
      case 'isNotNull':
        return Query.isNotNull(field);
      case 'between':
        if (secondValue !== undefined) {
          return Query.between(field, value, secondValue);
        }
        return null;
      case 'in':
        if (Array.isArray(value)) {
          return Query.equal(field, value);
        }
        return null;
      default:
        return null;
    }
  }

  private static buildSearchQuery(searchTerm: string, searchFields: string[]): string[] {
    // For full-text search across multiple fields
    return searchFields.map(field => Query.search(field, searchTerm));
  }

  static optimizeProfileSearchQuery(filters: {
    gender?: string;
    ageMin?: number;
    ageMax?: number;
    district?: string;
    block?: string;
    education?: string[];
    sect?: string;
    maritalStatus?: string;
    isVerified?: boolean;
    isActive?: boolean;
  }): QueryOptions {
    const queryFilters: QueryFilter[] = [];

    // Essential filters (most selective first)
    if (filters.gender) {
      queryFilters.push({ field: 'gender', operator: 'equal', value: filters.gender });
    }

    if (filters.isActive !== undefined) {
      queryFilters.push({ field: 'isActive', operator: 'equal', value: filters.isActive });
    }

    // Location filters (highly selective for Madhubani)
    if (filters.district) {
      queryFilters.push({ field: 'district', operator: 'equal', value: filters.district });
    }

    if (filters.block) {
      queryFilters.push({ field: 'block', operator: 'equal', value: filters.block });
    }

    // Age range (compound filter)
    if (filters.ageMin && filters.ageMax) {
      queryFilters.push({ 
        field: 'age', 
        operator: 'between', 
        value: filters.ageMin, 
        secondValue: filters.ageMax 
      });
    } else if (filters.ageMin) {
      queryFilters.push({ field: 'age', operator: 'greaterThanEqual', value: filters.ageMin });
    } else if (filters.ageMax) {
      queryFilters.push({ field: 'age', operator: 'lessThanEqual', value: filters.ageMax });
    }

    // Religious filters
    if (filters.sect) {
      queryFilters.push({ field: 'sect', operator: 'equal', value: filters.sect });
    }

    // Education filter (array)
    if (filters.education && filters.education.length > 0) {
      queryFilters.push({ field: 'education', operator: 'in', value: filters.education });
    }

    // Status filters
    if (filters.maritalStatus) {
      queryFilters.push({ field: 'maritalStatus', operator: 'equal', value: filters.maritalStatus });
    }

    if (filters.isVerified !== undefined) {
      queryFilters.push({ field: 'isVerified', operator: 'equal', value: filters.isVerified });
    }

    return {
      filters: queryFilters,
      orderBy: 'lastActiveAt',
      orderDirection: 'desc',
      limit: 25
    };
  }

  static optimizeInterestQuery(userId: string, type: 'sent' | 'received'): QueryOptions {
    const field = type === 'sent' ? 'senderId' : 'receiverId';
    
    return {
      filters: [
        { field, operator: 'equal', value: userId }
      ],
      orderBy: 'sentAt',
      orderDirection: 'desc',
      limit: 50
    };
  }

  static optimizeNotificationQuery(userId: string, unreadOnly: boolean = false): QueryOptions {
    const filters: QueryFilter[] = [
      { field: 'userId', operator: 'equal', value: userId }
    ];

    if (unreadOnly) {
      filters.push({ field: 'isRead', operator: 'equal', value: false });
    }

    return {
      filters,
      orderBy: 'createdAt',
      orderDirection: 'desc',
      limit: 50
    };
  }

  static createPaginationResult<T>(
    documents: T[],
    total: number,
    page: number,
    limit: number
  ): PaginationResult<T> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      documents,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  static analyzeQueryPerformance(
    startTime: number,
    endTime: number,
    resultCount: number,
    cacheHit: boolean = false
  ): QueryPerformanceMetrics {
    const queryTime = endTime - startTime;
    const optimizationSuggestions: string[] = [];

    // Performance analysis
    if (queryTime > this.PERFORMANCE_THRESHOLD_MS) {
      optimizationSuggestions.push('Query execution time exceeds threshold. Consider adding indexes.');
    }

    if (resultCount > 1000) {
      optimizationSuggestions.push('Large result set. Consider adding pagination or more specific filters.');
    }

    if (!cacheHit && queryTime > 500) {
      optimizationSuggestions.push('Consider caching this query result for better performance.');
    }

    return {
      queryTime,
      resultCount,
      cacheHit,
      indexesUsed: [], // This would be populated by database analysis
      optimizationSuggestions
    };
  }

  static getRecommendedIndexes(): Array<{
    collection: string;
    fields: string[];
    type: 'single' | 'compound';
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }> {
    return [
      {
        collection: 'profiles',
        fields: ['gender', 'isActive'],
        type: 'compound',
        priority: 'high',
        reason: 'Most common filter combination for profile searches'
      },
      {
        collection: 'profiles',
        fields: ['district', 'block'],
        type: 'compound',
        priority: 'high',
        reason: 'Location-based filtering is very common'
      },
      {
        collection: 'profiles',
        fields: ['age'],
        type: 'single',
        priority: 'high',
        reason: 'Age range queries are frequent'
      },
      {
        collection: 'profiles',
        fields: ['sect', 'maritalStatus'],
        type: 'compound',
        priority: 'medium',
        reason: 'Religious and marital status filtering'
      },
      {
        collection: 'profiles',
        fields: ['lastActiveAt'],
        type: 'single',
        priority: 'high',
        reason: 'Used for ordering active profiles'
      },
      {
        collection: 'interests',
        fields: ['senderId', 'sentAt'],
        type: 'compound',
        priority: 'high',
        reason: 'Querying sent interests by user'
      },
      {
        collection: 'interests',
        fields: ['receiverId', 'sentAt'],
        type: 'compound',
        priority: 'high',
        reason: 'Querying received interests by user'
      },
      {
        collection: 'interests',
        fields: ['status'],
        type: 'single',
        priority: 'medium',
        reason: 'Filtering by interest status'
      },
      {
        collection: 'notifications',
        fields: ['userId', 'createdAt'],
        type: 'compound',
        priority: 'high',
        reason: 'User notifications ordered by time'
      },
      {
        collection: 'notifications',
        fields: ['userId', 'isRead'],
        type: 'compound',
        priority: 'medium',
        reason: 'Filtering unread notifications'
      }
    ];
  }
}