import mongoose from 'mongoose';
import { dbConnect } from '../config/database.js';
import { StoreService } from '../modules/store/store.service.js';
import Vendor from '../models/vendor.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testSearchAPI() {
  try {
    console.log('Connecting to DB...');
    await dbConnect();
    console.log('Connected.');

    // Force index build for GeoJSON
    console.log('Synchronizing indexes...');
    await Vendor.createIndexes();
    console.log('Indexes synced.');

    // Test 1: Basic search by name (Regex)
    console.log('--- Test 1: Search by Name "Nike" ---');
    const result1 = await StoreService.searchStores({ search: 'nike' });
    console.log(`Matching Stores: ${result1.total}`);
    if (result1.stores.length > 0) {
      console.log('Sample Store:', result1.stores[0]);
    }

    // Test 2: Geo search (Mock Hyderabad coords)
    console.log('--- Test 2: Geo Search ---');
    const result2 = await StoreService.searchStores({
      latitude: 17.3850,
      longitude: 78.4867,
      radius: 50
    });
    console.log(`Stores within 50km: ${result2.total}`);

    // Test 3: Mixed Search
    console.log('--- Test 3: Mixed Search (Search + Category) ---');
    const result3 = await StoreService.searchStores({
      search: 'store',
      categoryId: new mongoose.Types.ObjectId() // Mock ID
    });
    console.log(`Mixed Results: ${result3.total}`);

    console.log('DONE.');
  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testSearchAPI();
