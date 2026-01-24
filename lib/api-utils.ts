import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ============================================================================
// API Response Helpers
// ============================================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    pagination?: PaginationMeta;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export function successResponse<T>(
    data: T,
    message?: string,
    pagination?: PaginationMeta,
    status: number = 200
): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
        {
            success: true,
            data,
            message,
            pagination,
        },
        { status }
    );
}

export function errorResponse(
    error: string,
    status: number = 400
): NextResponse<ApiResponse> {
    return NextResponse.json(
        {
            success: false,
            error,
        },
        { status }
    );
}

export function createdResponse<T>(
    data: T,
    message?: string
): NextResponse<ApiResponse<T>> {
    return successResponse(data, message, undefined, 201);
}

// ============================================================================
// Error Handler Wrapper
// ============================================================================

type RouteHandler = (
    request: Request,
    context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
    return async (request, context) => {
        try {
            return await handler(request, context);
        } catch (error) {
            console.error('API Error:', error);

            if (error instanceof ZodError) {
                const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
                return errorResponse(`Validation error: ${messages.join(', ')}`, 400);
            }

            if (error instanceof Error) {
                // MongoDB duplicate key error
                if (error.message.includes('E11000')) {
                    return errorResponse('Duplicate entry: Record already exists', 409);
                }

                // MongoDB validation error
                if (error.name === 'ValidationError') {
                    return errorResponse(error.message, 400);
                }

                // MongoDB CastError (invalid ObjectId)
                if (error.name === 'CastError') {
                    return errorResponse('Invalid ID format', 400);
                }

                return errorResponse(error.message, 500);
            }

            return errorResponse('An unexpected error occurred', 500);
        }
    };
}

// ============================================================================
// Pagination Utilities
// ============================================================================

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

export function createPaginationMeta(
    page: number,
    limit: number,
    total: number
): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}

// ============================================================================
// Query Filter Builders
// ============================================================================

export function buildSearchFilter(
    searchParams: URLSearchParams,
    searchFields: string[]
): Record<string, unknown> {
    const search = searchParams.get('search');
    if (!search || searchFields.length === 0) {
        return {};
    }

    return {
        $or: searchFields.map((field) => ({
            [field]: { $regex: search, $options: 'i' },
        })),
    };
}

export function buildDateRangeFilter(
    searchParams: URLSearchParams,
    field: string = 'createdAt'
): Record<string, unknown> {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const filter: Record<string, unknown> = {};

    if (startDate || endDate) {
        filter[field] = {};
        if (startDate) {
            (filter[field] as Record<string, Date>).$gte = new Date(startDate);
        }
        if (endDate) {
            (filter[field] as Record<string, Date>).$lte = new Date(endDate);
        }
    }

    return filter;
}

export function buildStatusFilter(
    searchParams: URLSearchParams,
    field: string = 'status'
): Record<string, unknown> {
    const status = searchParams.get('status');
    if (!status) {
        return {};
    }
    return { [field]: status };
}

// ============================================================================
// Sort Builder
// ============================================================================

export function buildSortOptions(
    searchParams: URLSearchParams,
    defaultSort: string = '-createdAt'
): Record<string, 1 | -1> {
    const sortParam = searchParams.get('sort') || defaultSort;
    const sortOrder = sortParam.startsWith('-') ? -1 : 1;
    const sortField = sortParam.replace(/^-/, '');

    return { [sortField]: sortOrder };
}
