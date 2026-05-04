/**
 * Structured Logger Utility
 * Provides consistent logging levels and formatting across the system
 */
export const logger = {
  /**
   * Log informational messages for general system events
   * @param {string} message 
   * @param {Object} meta 
   */
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, Object.keys(meta).length ? meta : '');
  },

  /**
   * Log warnings for non-critical issues or suspicious activity
   * @param {string} message 
   * @param {Object} meta 
   */
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] ⚠️ WARN: ${message}`, Object.keys(meta).length ? meta : '');
  },

  /**
   * Log critical errors and failures
   * @param {string} message 
   * @param {Error|null} error 
   * @param {Object} meta 
   */
  error: (message, error = null, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 🚨 ERROR: ${message}`, error ? error : '', Object.keys(meta).length ? meta : '');
  },

  /**
   * Log security-specific events (Rate limit trips, Fraud flags, etc.)
   * @param {string} message 
   * @param {Object} meta 
   */
  security: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] 🛡️ SECURITY: ${message}`, meta);
  }
};

export default logger;
