#!/usr/bin/env tsx
/**
 * Import Payments Data to Payments Database
 * 
 * Purpose: Import payments and payment_transactions from payments-data.json to payments_db
 * Input: migration-data/payments-data.json
 * Output: payments_db database (PostgreSQL on port 5433)
 * 
 * Usage: pnpm tsx scripts/migration/import-payments-data.ts
 */

import { PrismaClient } from '../../../apps/payments-service/node_modules/.prisma/payments-client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PAYMENTS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/payments_db',
    },
  },
});

interface PaymentsData {
  payments: any[];
  paymentTransactions: any[];
  metadata: {
    exportedAt: string;
    paymentCount: number;
    transactionCount: number;
  };
}

async function importPaymentsData() {
  try {
    console.log('🚀 Starting Payments Data Import...');
    console.log('📦 Target: payments_db database (port 5433)');
    console.log('');

    // Read data file
    const dataPath = path.join(process.cwd(), 'migration-data', 'payments-data.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found: ${dataPath}`);
    }

    const paymentsData: PaymentsData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📊 Data Source: ${paymentsData.metadata.exportedAt}`);
    console.log(`   - Payments: ${paymentsData.metadata.paymentCount}`);
    console.log(`   - Payment Transactions: ${paymentsData.metadata.transactionCount}`);
    console.log('');

    // Import payments
    console.log('📥 Importing payments...');
    let paymentsImported = 0;
    for (const payment of paymentsData.payments) {
      await prisma.payment.create({
        data: {
          id: payment.id,
          senderId: payment.senderId,
          recipientId: payment.recipientId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          type: payment.type,
          description: payment.description,
          metadata: payment.metadata,
          pspTransactionId: payment.pspTransactionId,
          pspStatus: payment.pspStatus,
          failureReason: payment.failureReason,
          completedAt: payment.completedAt ? new Date(payment.completedAt) : null,
          createdAt: new Date(payment.createdAt),
          updatedAt: new Date(payment.updatedAt),
        },
      });
      paymentsImported++;
    }
    console.log(`✓ Imported ${paymentsImported} payments`);

    // Import payment transactions
    console.log('📥 Importing payment transactions...');
    let transactionsImported = 0;
    for (const transaction of paymentsData.paymentTransactions) {
      await prisma.paymentTransaction.create({
        data: {
          id: transaction.id,
          paymentId: transaction.paymentId,
          status: transaction.status,
          statusMessage: transaction.statusMessage,
          pspTransactionId: transaction.pspTransactionId,
          metadata: transaction.metadata,
          createdAt: new Date(transaction.createdAt),
        },
      });
      transactionsImported++;
    }
    console.log(`✓ Imported ${transactionsImported} payment transactions`);

    console.log('');
    console.log('✅ Payments data import completed successfully!');
    console.log('');
    console.log('📈 Import Summary:');
    console.log(`   - Payments Imported: ${paymentsImported}`);
    console.log(`   - Payment Transactions Imported: ${transactionsImported}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing payments data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

importPaymentsData();
