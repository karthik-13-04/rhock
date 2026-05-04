import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Agent from './models/agent.model.js';
import { dbConnect } from './config/database.js';

dotenv.config({ path: '.env.local' });

const agents = [
  { code: 'AGT12345', isActive: true },
  { code: 'OFFER10', isActive: true },
  { code: 'DIGITWEETS', isActive: true },
  { code: 'EXPIRED_CODE', isActive: false }
];

async function seedAgents() {
  try {
    await dbConnect();
    
    console.log('Seeding agents...');
    
    for (const agent of agents) {
      await Agent.findOneAndUpdate(
        { code: agent.code },
        agent,
        { upsert: true, new: true }
      );
    }
    
    const allAgents = await Agent.find({});
    console.log('✅ Agents seeded successfully:', allAgents.map(a => ({ code: a.code, active: a.isActive })));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedAgents();
