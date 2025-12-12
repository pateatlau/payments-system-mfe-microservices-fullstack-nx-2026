#!/usr/bin/env tsx
/**
 * Rollback Auth Database
 * 
 * Purpose: Clear all data from auth_db in case migration needs to be rolled back
 * Target: auth_db database (PostgreSQL on port 5432)
 * 
 * WARNING: This will DELETE ALL DATA from the auth_db database!
 * 
 * Usage: pnpm tsx scripts/migration/rollback-auth.ts
 */

import { PrismaClient } from '../../../apps/auth-service/node_modules/.prisma/auth-client';
import * as readline from 'readline';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.AUTH_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_db',
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

async function rollbackAuth() {
  try {
    console.log('⚠️  WARNING: Auth Database Rollback');
    console.log('');
    console.log('This will DELETE ALL DATA from the auth_db database:');
    console.log('  - All users');
    console.log('  - All refresh tokens');
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
    console.log('🔄 Starting Auth Database Rollback...');
    console.log('');

    // Delete in correct order (child tables first due to foreign keys)
    console.log('🗑️  Deleting refresh tokens...');
    const tokensDeleted = await prisma.refreshToken.deleteMany();
    console.log(`✓ Deleted ${tokensDeleted.count} refresh tokens`);

    console.log('🗑️  Deleting users...');
    const usersDeleted = await prisma.user.deleteMany();
    console.log(`✓ Deleted ${usersDeleted.count} users`);

    console.log('');
    console.log('✅ Auth database rollback completed successfully!');
    console.log('');
    console.log('📈 Rollback Summary:');
    console.log(`   - Users Deleted: ${usersDeleted.count}`);
    console.log(`   - Refresh Tokens Deleted: ${tokensDeleted.count}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error rolling back auth database:', error);
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

rollbackAuth();
