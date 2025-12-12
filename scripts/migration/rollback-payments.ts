#!/usr/bin/env tsx
/**
 * Rollback Payments Database
 * 
 * Purpose: Clear all data from payments_db in case migration needs to be rolled back
 * Target: payments_db database (PostgreSQL on port 5433)
 * 
 * WARNING: This will DELETE ALL DATA from the payments_db database!
 * 
 * Usage: pnpm tsx scripts/migration/rollback-payments.ts
 */

import { PrismaClient } from '../../../apps/payments-service/node_modules/.prisma/payments-client';
import * as readline from 'readline';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PAYMENTS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/payments_db',
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

async function rollbackPayments() {
  try {
    console.log('⚠️  WARNING: Payments Database Rollback');
    console.log('');
    console.log('This will DELETE ALL DATA from the payments_db database:');
    console.log('  - All payments');
    console.log('  - All payment transactions');
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
    console.log('🔄 Starting Payments Database Rollback...');
    console.log('');

    // Delete in correct order (child tables first due to foreign keys)
    console.log('🗑️  Deleting payment transactions...');
    const transactionsDeleted = await prisma.paymentTransaction.deleteMany();
    console.log(`✓ Deleted ${transactionsDeleted.count} payment transactions`);

    console.log('🗑️  Deleting payments...');
    const paymentsDeleted = await prisma.payment.deleteMany();
    console.log(`✓ Deleted ${paymentsDeleted.count} payments`);

    console.log('');
    console.log('✅ Payments database rollback completed successfully!');
    console.log('');
    console.log('📈 Rollback Summary:');
    console.log(`   - Payments Deleted: ${paymentsDeleted.count}`);
    console.log(`   - Payment Transactions Deleted: ${transactionsDeleted.count}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error rolling back payments database:', error);
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

rollbackPayments();
