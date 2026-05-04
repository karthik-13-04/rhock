/**
 * MongoDB Database Configuration
 * Database: rhockdeal
 * Host: Cluster0 (MongoDB Atlas)
 * Storage: Contabo S3 for media files
 */

import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Node.js SRV resolution issue on certain ISPs / Networks
// This specifically addresses querySrv ECONNREFUSED
try {
  // Use Google DNS as primary for SRV resolution
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  
  // Node 17+ defaults to seeking IPv6 first, which can cause issues with some DNS/ISPs
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  console.warn('Could not set DNS servers or result order:', e.message);
}

// Singleton pattern to prevent multiple connections in development
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with caching
 * Prevents multiple connections during hot reloads in development
 */
async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to fix ECONNREFUSED with Node 17+
    };

    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB Connected Successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB Connection Error:', error.message);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB (useful for cleanup)
 */
async function dbDisconnect() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('🔌 MongoDB Disconnected');
  }
}

export { dbConnect, dbDisconnect };
