#!/usr/bin/env tsx
/**
 * Validate Migration Data
 * 
 * Purpose: Verify row counts and data integrity after migration
 * Input: All databases (mfe_poc2, auth_db, payments_db, admin_db, profile_db)
 * Output: Console report with validation results
 * 
 * Usage: pnpm tsx scripts/migration/validate-migration.ts
 */

import { PrismaClient as LegacyPrisma } from '@prisma/client';
import { PrismaClient as AuthPrisma } from '../../../apps/auth-service/node_modules/.prisma/auth-client';
import { PrismaClient as PaymentsPrisma } from '../../../apps/payments-service/node_modules/.prisma/payments-client';
import { PrismaClient as AdminPrisma } from '../../../apps/admin-service/node_modules/.prisma/admin-client';
import { PrismaClient as ProfilePrisma } from '../../../apps/profile-service/node_modules/.prisma/profile-client';

const legacyDb = new LegacyPrisma({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5436/mfe_poc2',
    },
  },
});

const authDb = new AuthPrisma({
  datasources: {
    db: {
      url: process.env.AUTH_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_db',
    },
  },
});

const paymentsDb = new PaymentsPrisma({
  datasources: {
    db: {
      url: process.env.PAYMENTS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/payments_db',
    },
  },
});

const adminDb = new AdminPrisma({
  datasources: {
    db: {
      url: process.env.ADMIN_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/admin_db',
    },
  },
});

const profileDb = new ProfilePrisma({
  datasources: {
    db: {
      url: process.env.PROFILE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5435/profile_db',
    },
  },
});

interface ValidationResult {
  entity: string;
  source: string;
  target: string;
  sourceCount: number;
  targetCount: number;
  match: boolean;
}

async function validateMigration() {
  try {
    console.log('🔍 Starting Migration Validation...');
    console.log('');

    const results: ValidationResult[] = [];

    // Validate Users
    console.log('📊 Validating Users...');
    const legacyUsersCount = await legacyDb.user.count();
    const authUsersCount = await authDb.user.count();
    results.push({
      entity: 'Users',
      source: 'mfe_poc2',
      target: 'auth_db',
      sourceCount: legacyUsersCount,
      targetCount: authUsersCount,
      match: legacyUsersCount === authUsersCount,
    });

    // Validate Refresh Tokens
    console.log('📊 Validating Refresh Tokens...');
    const legacyTokensCount = await legacyDb.refreshToken.count();
    const authTokensCount = await authDb.refreshToken.count();
    results.push({
      entity: 'Refresh Tokens',
      source: 'mfe_poc2',
      target: 'auth_db',
      sourceCount: legacyTokensCount,
      targetCount: authTokensCount,
      match: legacyTokensCount === authTokensCount,
    });

    // Validate Payments
    console.log('📊 Validating Payments...');
    const legacyPaymentsCount = await legacyDb.payment.count();
    const paymentsCount = await paymentsDb.payment.count();
    results.push({
      entity: 'Payments',
      source: 'mfe_poc2',
      target: 'payments_db',
      sourceCount: legacyPaymentsCount,
      targetCount: paymentsCount,
      match: legacyPaymentsCount === paymentsCount,
    });

    // Validate Payment Transactions
    console.log('📊 Validating Payment Transactions...');
    const legacyTransactionsCount = await legacyDb.paymentTransaction.count();
    const transactionsCount = await paymentsDb.paymentTransaction.count();
    results.push({
      entity: 'Payment Transactions',
      source: 'mfe_poc2',
      target: 'payments_db',
      sourceCount: legacyTransactionsCount,
      targetCount: transactionsCount,
      match: legacyTransactionsCount === transactionsCount,
    });

    // Validate Audit Logs
    console.log('📊 Validating Audit Logs...');
    const legacyLogsCount = await legacyDb.auditLog.count();
    const adminLogsCount = await adminDb.auditLog.count();
    results.push({
      entity: 'Audit Logs',
      source: 'mfe_poc2',
      target: 'admin_db',
      sourceCount: legacyLogsCount,
      targetCount: adminLogsCount,
      match: legacyLogsCount === adminLogsCount,
    });

    // Validate System Config
    console.log('📊 Validating System Config...');
    const legacyConfigCount = await legacyDb.systemConfig.count();
    const adminConfigCount = await adminDb.systemConfig.count();
    results.push({
      entity: 'System Config',
      source: 'mfe_poc2',
      target: 'admin_db',
      sourceCount: legacyConfigCount,
      targetCount: adminConfigCount,
      match: legacyConfigCount === adminConfigCount,
    });

    // Validate User Profiles
    console.log('📊 Validating User Profiles...');
    const legacyProfilesCount = await legacyDb.userProfile.count();
    const profilesCount = await profileDb.userProfile.count();
    results.push({
      entity: 'User Profiles',
      source: 'mfe_poc2',
      target: 'profile_db',
      sourceCount: legacyProfilesCount,
      targetCount: profilesCount,
      match: legacyProfilesCount === profilesCount,
    });

    // Print Results
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    VALIDATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    const allMatched = results.every((r) => r.match);

    for (const result of results) {
      const status = result.match ? '✅' : '❌';
      console.log(`${status} ${result.entity}`);
      console.log(`   Source (${result.source}): ${result.sourceCount} rows`);
      console.log(`   Target (${result.target}): ${result.targetCount} rows`);
      if (!result.match) {
        console.log(`   ⚠️  MISMATCH: Difference of ${Math.abs(result.sourceCount - result.targetCount)} rows`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════');
    
    if (allMatched) {
      console.log('');
      console.log('✅ ALL VALIDATIONS PASSED!');
      console.log('   Migration completed successfully with no data loss.');
    } else {
      console.log('');
      console.log('❌ VALIDATION FAILED!');
      console.log('   Some entities have mismatched row counts.');
      console.log('   Please review the migration process.');
    }

    console.log('');

    // Disconnect all clients
    await legacyDb.$disconnect();
    await authDb.$disconnect();
    await paymentsDb.$disconnect();
    await adminDb.$disconnect();
    await profileDb.$disconnect();

    process.exit(allMatched ? 0 : 1);
  } catch (error) {
    console.error('❌ Error validating migration:', error);
    
    await legacyDb.$disconnect();
    await authDb.$disconnect();
    await paymentsDb.$disconnect();
    await adminDb.$disconnect();
    await profileDb.$disconnect();
    
    process.exit(1);
  }
}

validateMigration();
