/**
 * GET /api/debug/env
 * Internal debug endpoint to check server health and environment
 */

import { dbConnect } from '../../../../config/database.js';

export const GET = async () => {
  try {
    await dbConnect();
    return Response.json({
      success: true,
      message: 'Server and DB are healthy',
      data: {
        mongodb_uri_exists: !!process.env.MONGODB_URI,
        node_env: process.env.NODE_ENV,
        database: 'Connected',
      },
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: 'Server or DB error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
};
