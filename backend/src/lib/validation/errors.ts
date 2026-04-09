/**
 * Error handling utility
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
  }
  timestamp: string
}

/**
 * Standard API response wrapper
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  }
}

/**
 * Standard error response
 */
export function errorResponse(statusCode: number, message: string, code?: string): ApiResponse {
  return {
    success: false,
    error: {
      message,
      ...(code && { code })
    },
    timestamp: new Date().toISOString()
  }
}
