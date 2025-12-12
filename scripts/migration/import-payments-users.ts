#!/usr/bin/env tsx
/**
 * Import Users to Payments Database (Minimal Copy)
 * 
 * Purpose: Import users from auth-data.json to payments_db for zero-coupling
 * Input: migration-data/auth-data.json
 * Output: payments_db database (PostgreSQL on port 5433)
 * 
 * Note: This creates a minimal denormalized copy of users in payments_db for
 * recipient validation. Only id and email are stored.
 * 
 * Usage: pnpm tsx scripts/migration/import-payments-users.ts
 */

import { PrismaClient } from '../../apps/payments-service/node_modules/.prisma/payments-client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PAYMENTS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/payments_db',
    },
  },
});

interface AuthData {
  users: any[];
  metadata: any;
}

async function importPaymentsUsers() {
  try {
    console.log('Starting Payments Users Import (Minimal Copy)...');
    console.log('Target: payments_db database (port 5433)');
    console.log('');

    // Read auth data file
    const dataPath = path.join(process.cwd(), 'migration-data', 'auth-data.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found: ${dataPath}`);
    }

    const authData: AuthData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`Data Source: ${authData.metadata.exportedAt}`);
    console.log(`   - Users: ${authData.metadata.userCount}`);
    console.log('');

    // Import users (minimal: only id and email for recipient validation)
    console.log('Importing users to payments_db (minimal)...');
    let usersImported = 0;
    for (const user of authData.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          // Note: Only minimal fields for recipient validation
        },
      });
      usersImported++;
    }
    console.log(`Imported ${usersImported} users`);

    console.log('');
    console.log('Payments users import completed successfully!');
    console.log('');
    console.log('Import Summary:');
    console.log(`   - Users Imported: ${usersImported}`);
    console.log(`   - Fields Stored: id, email only`);
    console.log('');
    console.log('Note: This is a minimal copy for recipient validation.');
    console.log('      User data will be synchronized via RabbitMQ events in Phase 4.');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error importing payments users:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

importPaymentsUsers();
