#!/usr/bin/env tsx
/**
 * Import Admin Data to Admin Database
 * 
 * Purpose: Import audit_logs and system_config from admin-data.json to admin_db
 * Input: migration-data/admin-data.json
 * Output: admin_db database (PostgreSQL on port 5434)
 * 
 * Usage: pnpm tsx scripts/migration/import-admin-data.ts
 */

import { PrismaClient } from '../../apps/admin-service/node_modules/.prisma/admin-client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.ADMIN_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/admin_db',
    },
  },
});

interface AdminData {
  auditLogs: any[];
  systemConfig: any[];
  metadata: {
    exportedAt: string;
    auditLogCount: number;
    configCount: number;
  };
}

async function importAdminData() {
  try {
    console.log('🚀 Starting Admin Data Import...');
    console.log('📦 Target: admin_db database (port 5434)');
    console.log('');

    // Read data file
    const dataPath = path.join(process.cwd(), 'migration-data', 'admin-data.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found: ${dataPath}`);
    }

    const adminData: AdminData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📊 Data Source: ${adminData.metadata.exportedAt}`);
    console.log(`   - Audit Logs: ${adminData.metadata.auditLogCount}`);
    console.log(`   - System Config: ${adminData.metadata.configCount}`);
    console.log('');

    // Note: Users are imported separately (export-auth-data.ts → import-admin-data-users.ts)
    // This script only imports audit logs and system config

    // Import audit logs
    console.log('Importing audit logs...');
    let logsImported = 0;
    for (const log of adminData.auditLogs) {
      await prisma.auditLog.create({
        data: {
          id: log.id,
          userId: log.userId,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          details: log.details,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: new Date(log.createdAt),
        },
      });
      logsImported++;
    }
    console.log(`✓ Imported ${logsImported} audit logs`);

    // Import system config
    console.log('Importing system config...');
    let configImported = 0;
    for (const config of adminData.systemConfig) {
      await prisma.systemConfig.create({
        data: {
          key: config.key,
          value: config.value,
          description: config.description,
          updatedAt: new Date(config.updatedAt),
          updatedBy: config.updatedBy,
        },
      });
      configImported++;
    }
    console.log(`✓ Imported ${configImported} system config entries`);

    console.log('');
    console.log('✅ Admin data import completed successfully!');
    console.log('');
    console.log('📈 Import Summary:');
    console.log(`   - Audit Logs Imported: ${logsImported}`);
    console.log(`   - System Config Imported: ${configImported}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing admin data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

importAdminData();
