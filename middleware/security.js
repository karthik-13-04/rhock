/**
 * Security Middleware & Utilities
 * Focused on input sanitization and NoSQL injection prevention
 */

/**
 * Deeply sanitizes an object to remove any keys starting with $ 
 * (MongoDB operators) to prevent NoSQL injection.
 * @param {any} input 
 * @returns {any} Sanitized input
 */
export function sanitizeNoSql(input) {
  if (Array.isArray(input)) {
    return input.map(item => sanitizeNoSql(item));
  }
  
  if (input !== null && typeof input === 'object') {
    const sanitized = {};
    for (const key in input) {
      // Reject keys starting with $
      if (!key.startsWith('$')) {
        sanitized[key] = sanitizeNoSql(input[key]);
      } else {
        console.warn(`[Security] Sanitized NoSQL operator: ${key}`);
      }
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Controller-level helper to sanitize incoming JSON body
 * Usage: const body = await sanitizeBody(req);
 * @param {Request} req 
 */
export async function getSanitizedBody(req) {
  try {
    const body = await req.json();
    return sanitizeNoSql(body);
  } catch (error) {
    return {};
  }
}
