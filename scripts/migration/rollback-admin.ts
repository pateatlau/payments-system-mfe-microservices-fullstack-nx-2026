#!/usr/bin/env tsx
/**
 * Rollback Admin Database
 * 
 * Purpose: Clear all data from admin_db in case migration needs to be rolled back
 * Target: admin_db database (PostgreSQL on port 5434)
 * 
 * WARNING: This will DELETE ALL DATA from the admin_db database!
 * 
 * Usage: pnpm tsx scripts/migration/rollback-admin.ts
 */

import { PrismaClient } from '../../../apps/admin-service/node_modules/.prisma/admin-client';
import * as readline from 'readline';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.ADMIN_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/admin_db',
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

async function rollbackAdmin() {
  try {
    console.log('⚠️  WARNING: Admin Database Rollback');
    console.log('');
    console.log('This will DELETE ALL DATA from the admin_db database:');
    console.log('  - All audit logs');
    console.log('  - All system config');
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
    console.log('🔄 Starting Admin Database Rollback...');
    console.log('');

    // Delete audit logs
    console.log('🗑️  Deleting audit logs...');
    const logsDeleted = await prisma.auditLog.deleteMany();
    console.log(`✓ Deleted ${logsDeleted.count} audit logs`);

    // Delete system config
    console.log('🗑️  Deleting system config...');
    const configDeleted = await prisma.systemConfig.deleteMany();
    console.log(`✓ Deleted ${configDeleted.count} system config entries`);

    console.log('');
    console.log('✅ Admin database rollback completed successfully!');
    console.log('');
    console.log('📈 Rollback Summary:');
    console.log(`   - Audit Logs Deleted: ${logsDeleted.count}`);
    console.log(`   - System Config Deleted: ${configDeleted.count}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error rolling back admin database:', error);
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

rollbackAdmin();
