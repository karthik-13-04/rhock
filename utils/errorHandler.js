/**
 * Custom Error Handler for API responses
 * Provides consistent error response format across all endpoints
 * Compatible with Next.js App Router (Response.json)
 */

/**
 * Standard API Error Response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} [errorType] - Type of error (validation, authentication, etc.)
 * @param {object} [details] - Additional error details
 * @returns {Response} Next.js Response object
 */
function apiError(statusCode, message, errorType = 'API_ERROR', details = null) {
  const response = {
    success: false,
    error: {
      type: errorType,
      message,
      ...(details && { details }),
    },
  };

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[API Error] ${statusCode} - ${message}`, details || '');
  }

  return Response.json(response, { status: statusCode });
}

/**
 * Standard API Success Response
 * @param {object} data - Response data
 * @param {string} [message] - Optional success message
 * @param {object} [pagination] - Optional pagination info
 * @returns {Response} Next.js Response object
 */
function apiSuccess(data, message = 'Success', pagination = null) {
  const response = {
    success: true,
    message,
    data,
    ...(pagination && { pagination }),
  };

  return Response.json(response, { status: 200 });
}

/**
 * Async error handler wrapper for route handlers
 * Wraps async functions to catch errors and return consistent Response objects
 * @param {function} fn - Async route handler function
 */
function asyncHandler(fn) {
  return async (req, context) => {
    try {
      return await fn(req, context);
    } catch (error) {
      console.error('[Async Handler Error]', error);
      
      // Handle known error types
      if (error.name === 'ValidationError') {
        return apiError(400, error.message, 'VALIDATION_ERROR', error.errors);
      }
      
      if (error.name === 'CastError') {
        return apiError(400, 'Invalid ID format', 'VALIDATION_ERROR');
      }
      
      if (error.name === 'JsonWebTokenError') {
        return apiError(401, 'Invalid token', 'AUTHENTICATION_ERROR');
      }
      
      if (error.name === 'TokenExpiredError') {
        return apiError(401, 'Token expired', 'AUTHENTICATION_ERROR');
      }

      // Default error response
      return apiError(
        error.statusCode || 500,
        error.message || 'Internal server error',
        error.errorType || 'INTERNAL_ERROR'
      );
    }
  };
}

export { apiError, apiSuccess, asyncHandler };
