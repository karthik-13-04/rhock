/**
 * Validation Middleware
 * Validates request body, params, and query against schemas
 * 
 * Database: MongoDB Atlas (Cluster0)
 * Connection: mongodb+srv://manikanta_db_user:***@cluster0.m4lmy8d.mongodb.net/rhockdeal
 * Storage: Contabo S3 (sin1.contabostorage.com)
 */

import { apiError } from '../utils/errorHandler.js';

/**
 * Validation Middleware
 * Validates request body, params, and query against schemas
 */

/**
 * Validate request body against a Joi-like schema
 * @param {object} schema - Validation schema with validate function
 */
export function validateBody(schema) {
  return async (req, res, next) => {
    try {
      const body = await req.json();
      req.body = body;

      if (schema && typeof schema.validate === 'function') {
        const { error, value } = schema.validate(body);

        if (error) {
          const message = error.details.map(d => d.message).join(', ');
          return apiError(res, 400, message, 'VALIDATION_ERROR', error.details);
        }

        // Replace body with validated/sanitized value
        req.body = value;
      }

      next();
    } catch (error) {
      return apiError(res, 400, 'Invalid JSON body', 'VALIDATION_ERROR');
    }
  };
}

/**
 * Validate request query parameters
 * @param {object} schema - Validation schema
 */
export function validateQuery(schema) {
  return async (req, res, next) => {
    if (schema && typeof schema.validate === 'function') {
      const { error, value } = schema.validate(req.query);

      if (error) {
        const message = error.details.map(d => d.message).join(', ');
        return apiError(res, 400, message, 'VALIDATION_ERROR', error.details);
      }

      req.query = value;
    }

    next();
  };
}

/**
 * Validate URL parameters
 * @param {object} schema - Validation schema
 */
export function validateParams(schema) {
  return async (req, res, next) => {
    if (schema && typeof schema.validate === 'function') {
      const { error, value } = schema.validate(req.params);

      if (error) {
        const message = error.details.map(d => d.message).join(', ');
        return apiError(res, 400, message, 'VALIDATION_ERROR', error.details);
      }

      req.params = value;
    }

    next();
  };
}

/**
 * Simple email validation
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Simple phone validation (Indian numbers)
 */
export function isValidPhone(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
