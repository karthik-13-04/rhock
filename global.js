/**
 * Global type declarations
 * Extends the global object with mongoose connection cache
 */

// Declare global mongoose cache to prevent TypeScript errors
if (typeof global !== 'undefined') {
  global.mongoose = global.mongoose || { conn: null, promise: null };
}

export {};
