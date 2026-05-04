import mongoose from 'mongoose';
import { dbConnect } from '../config/database.js';
import { StoreService } from '../modules/store/store.service.js';
import Vendor from '../models/vendor.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testStoreAPI() {
  try {
    console.log('Connecting to DB...');
    await dbConnect();
    console.log('Connected.');

    // 1. Find an active vendor to test
    const testVendor = await Vendor.findOne({ status: 'active' });
    
    if (!testVendor) {
      console.log('No active vendor found in database. Testing with non-existent ID.');
      const result = await StoreService.getStoreDetails(new mongoose.Types.ObjectId());
      console.log('Result (expected null):', result);
    } else {
      console.log(`Testing with Vendor ID: ${testVendor._id} (${testVendor.storeName})`);
      
      // 2. Fetch Store Details
      const result = await StoreService.getStoreDetails(testVendor._id.toString());
      
      if (result) {
        console.log('Store Info:', JSON.stringify(result.store, null, 2));
        console.log(`Deals Count: ${result.deals.length}`);
        if (result.deals.length > 0) {
          console.log('Sample Deal:', result.deals[0].title);
        }
      } else {
        console.log('Failed to fetch store details for active vendor.');
      }
    }

    // 3. Test with invalid ID format
    console.log('--- Test: Invalid ID format ---');
    try {
      await StoreService.getStoreDetails('invalid-id');
    } catch (err) {
      console.log('Caught expected error for invalid ID format:', err.message);
    }

    console.log('DONE.');
  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testStoreAPI();
