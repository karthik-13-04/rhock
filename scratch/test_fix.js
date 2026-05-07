import { createAd } from '../services/ad.service.js';
import mongoose from 'mongoose';

console.log('Testing ad.service.js import...');

if (typeof createAd === 'function') {
  console.log('✅ createAd is a function');
} else {
  console.log('❌ createAd is NOT a function');
}

// Test mongoose reference
try {
  const testId = new mongoose.Types.ObjectId();
  console.log('✅ mongoose.Types.ObjectId works:', testId);
} catch (e) {
  console.log('❌ mongoose.Types.ObjectId failed:', e.message);
}

console.log('Test complete.');
process.exit(0);
