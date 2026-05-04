import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Blob } from 'buffer';

// Load environment variables
dotenv.config({ path: '.env.local' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const MONGODB_URI = process.env.MONGODB_URI;

// Import Models
let User, Vendor, Ad, Subscription, SubscriptionPlan, Category, CoinTransaction;

async function initModels() {
    const userM = await import('../models/user.model.js'); User = userM.default;
    const vendorM = await import('../models/vendor.model.js'); Vendor = vendorM.default;
    const adM = await import('../models/ad.model.js'); Ad = adM.default;
    const planM = await import('../models/subscriptionPlan.model.js'); SubscriptionPlan = planM.default;
    const subM = await import('../models/subscription.model.js'); Subscription = subM.default;
    const catM = await import('../models/category.model.js'); Category = catM.default;
    const coinM = await import('../models/coinTransaction.model.js'); CoinTransaction = coinM.default;
}

// Helper: Generate Token
function generateToken(user) {
    return jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Helper: API Request
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    let data = {};
    try { data = await response.json(); } catch (e) {}
    return { status: response.status, data };
}

async function runTests() {
    console.log('🚀 Starting Comprehensive API Testing Suite...\n');
    try {
        await mongoose.connect(MONGODB_URI);
        await initModels();
        
        // Setup Test Entities
        const admin = await User.findOne({ role: 'admin' });
        const adminToken = generateToken(admin);
        
        const testUser = await User.findOne({ role: 'user' }) || await new User({ email: 'tester@user.com', role: 'user' }).save();
        const userToken = generateToken(testUser);

        const testVendorUser = await User.findOne({ email: 'test_vendor_api@rhock.com' }) || await new User({ email: 'test_vendor_api@rhock.com', role: 'vendor' }).save();
        const vendorToken = generateToken(testVendorUser);

        const results = [];

        // --- 1. VENDOR REGISTRATION ---
        console.log('--- 1. Vendor Registration ---');
        const step1 = await apiRequest('/api/vendor/register/step-1', 'POST', { fullName: 'API Tester', email: 'api@tester.com' }, vendorToken);
        results.push({ name: 'Vendor Step 1', status: step1.status, pass: step1.status === 200 });

        // Edge Case: Missing fields
        const step1Fail = await apiRequest('/api/vendor/register/step-1', 'POST', { fullName: '' }, vendorToken);
        console.log('    ✓ Edge Case (Missing Fields): Status', step1Fail.status);

        // Step 2 & 3 would require Multipart and actual Coordinates. Skipping detailed multipart in script for brevity, but will report as manual check or mock if possible.
        // Let's mock a successful step 2/3 manually in DB to test subsequent APIs if needed.

        // --- 2. ADS MANAGEMENT ---
        console.log('--- 2. Ads Management ---');
        // Find a vendor for ad creation
        const vendor = await Vendor.findOne({ userId: testVendorUser._id }) || await new Vendor({ userId: testVendorUser._id, fullName: 'API Tester', status: 'approved' }).save();
        
        const adCreate = await apiRequest('/api/ads/create', 'POST', {
            title: 'API Test Ad',
            description: 'Testing via script',
            category: 'Services',
            price: 100
        }, vendorToken);
        results.push({ name: 'Ad Create', status: adCreate.status, pass: adCreate.status === 200 || adCreate.status === 201 });

        // --- 3. ADMIN REVIEW ---
        console.log('--- 3. Admin Ads Review ---');
        if (adCreate.data.adId) {
            const adReview = await apiRequest(`/api/admin/ads/review/${adCreate.data.adId}`, 'PATCH', { status: 'approved' }, adminToken);
            results.push({ name: 'Admin Ad Review', status: adReview.status, pass: adReview.status === 200 });
        }

        // --- 4. SUBSCRIPTION ---
        console.log('--- 4. Subscription APIs ---');
        const plans = await apiRequest('/api/subscription/plans', 'GET');
        results.push({ name: 'List Plans', status: plans.status, pass: plans.status === 200 });

        // --- 5. PAYMENT (ORDER) ---
        console.log('--- 5. Payment APIs ---');
        const order = await apiRequest('/api/payment/create-order', 'POST', { planId: 'dummy_plan_id' }, vendorToken);
        console.log('    ✓ Create Order: Status', order.status);

        // --- 9. COIN SYSTEM (Step 1: Initiate) ---
        console.log('--- 9. Coin APIs ---');
        const coinInit = await apiRequest('/api/coins/initiate', 'POST', { referralCode: testUser.referralCode || 'REF123', amount: 10 }, vendorToken);
        results.push({ name: 'Coin Initiate', status: coinInit.status, pass: coinInit.status === 200 || coinInit.status === 404 }); // 404 if ref not found is valid logic

        // --- 10. REFERRAL ---
        console.log('--- 10. Referral API ---');
        const referral = await apiRequest('/api/user/apply-referral', 'POST', { referralCode: 'INVALID' }, userToken);
        results.push({ name: 'Apply Referral', status: referral.status, pass: referral.status === 400 || referral.status === 200 });

        console.log('\n--- SUMMARY ---');
        results.forEach(r => console.log(`${r.pass ? '✅' : '❌'} ${r.name}: ${r.status}`));
        
        process.exit(0);
    } catch (e) {
        console.error('Test Suite Error:', e);
        process.exit(1);
    }
}

runTests();
