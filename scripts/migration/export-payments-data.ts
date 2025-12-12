#!/usr/bin/env tsx
/**
 * Export Payments Data from Legacy Database
 *
 * Purpose: Export payments and payment_transactions from mfe_poc2 to payments-data.json
 * Input: mfe_poc2 database (PostgreSQL on port 5436)
 * Output: migration-data/payments-data.json
 *
 * Usage: pnpm tsx scripts/migration/export-payments-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5436/mfe_poc2',
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

async function exportPaymentsData() {
  try {
    console.log('🚀 Starting Payments Data Export...');
    console.log('📦 Source: mfe_poc2 database (port 5436)');
    console.log('');

    // Export payments
    console.log('📊 Exporting payments...');
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Exported ${payments.length} payments`);

    // Export payment transactions
    console.log('📊 Exporting payment transactions...');
    const paymentTransactions = await prisma.paymentTransaction.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(
      `✓ Exported ${paymentTransactions.length} payment transactions`
    );

    // Prepare data structure
    const paymentsData: PaymentsData = {
      payments,
      paymentTransactions,
      metadata: {
        exportedAt: new Date().toISOString(),
        paymentCount: payments.length,
        transactionCount: paymentTransactions.length,
      },
    };

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'migration-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    const outputPath = path.join(outputDir, 'payments-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(paymentsData, null, 2));

    console.log('');
    console.log('✅ Payments data export completed successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log('');
    console.log('📈 Export Summary:');
    console.log(`   - Payments: ${paymentsData.metadata.paymentCount}`);
    console.log(
      `   - Payment Transactions: ${paymentsData.metadata.transactionCount}`
    );
    console.log(`   - Exported At: ${paymentsData.metadata.exportedAt}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error exporting payments data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

exportPaymentsData();
