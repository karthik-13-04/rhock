import mongoose from 'mongoose';
import { dbConnect } from '../config/database.js';
import { DealsService } from '../modules/deals/deals.service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testDealsAPI() {
  try {
    console.log('Connecting to DB...');
    await dbConnect();
    console.log('Connected.');

    // Test 1: Fetch all deals (default)
    console.log('--- Test 1: Default Fetch ---');
    const result1 = await DealsService.getDeals({});
    console.log(`Total Deals: ${result1.total}`);
    console.log(`Deals Count: ${result1.deals.length}`);
    if (result1.deals.length > 0) {
      console.log('Sample Deal:', JSON.stringify(result1.deals[0], null, 2));
    }

    // Test 2: Search Fetch
    console.log('--- Test 2: Search "Nike" ---');
    const result2 = await DealsService.getDeals({ search: 'nike' });
    console.log(`Matching Deals: ${result2.total}`);

    // Test 3: Pagination
    console.log('--- Test 3: Pagination (Page 1, Limit 1) ---');
    const result3 = await DealsService.getDeals({ page: 1, limit: 1 });
    console.log(`Deals Count (Limit 1): ${result3.deals.length}`);

    console.log('DONE.');
  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testDealsAPI();
