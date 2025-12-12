#!/usr/bin/env tsx
/**
 * Rollback Profile Database
 * 
 * Purpose: Clear all data from profile_db in case migration needs to be rolled back
 * Target: profile_db database (PostgreSQL on port 5435)
 * 
 * WARNING: This will DELETE ALL DATA from the profile_db database!
 * 
 * Usage: pnpm tsx scripts/migration/rollback-profile.ts
 */

import { PrismaClient } from '../../../apps/profile-service/node_modules/.prisma/profile-client';
import * as readline from 'readline';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PROFILE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5435/profile_db',
    },
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function rollbackProfile() {
  try {
    console.log('⚠️  WARNING: Profile Database Rollback');
    console.log('');
    console.log('This will DELETE ALL DATA from the profile_db database:');
    console.log('  - All user profiles');
    console.log('');

    const confirmed = await askConfirmation('Type "yes" to confirm rollback: ');
    rl.close();

    if (!confirmed) {
      console.log('');
      console.log('❌ Rollback cancelled by user.');
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log('');
    console.log('🔄 Starting Profile Database Rollback...');
    console.log('');

    // Delete user profiles
    console.log('🗑️  Deleting user profiles...');
    const profilesDeleted = await prisma.userProfile.deleteMany();
    console.log(`✓ Deleted ${profilesDeleted.count} user profiles`);

    console.log('');
    console.log('✅ Profile database rollback completed successfully!');
    console.log('');
    console.log('📈 Rollback Summary:');
    console.log(`   - User Profiles Deleted: ${profilesDeleted.count}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error rolling back profile database:', error);
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

rollbackProfile();
