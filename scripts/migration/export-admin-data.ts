#!/usr/bin/env tsx
/**
 * Export Admin Data from Legacy Database
 * 
 * Purpose: Export audit_logs and system_config from mfe_poc2 to admin-data.json
 * Input: mfe_poc2 database (PostgreSQL on port 5436)
 * Output: migration-data/admin-data.json
 * 
 * Usage: pnpm tsx scripts/migration/export-admin-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5436/mfe_poc2',
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

async function exportAdminData() {
  try {
    console.log('🚀 Starting Admin Data Export...');
    console.log('📦 Source: mfe_poc2 database (port 5436)');
    console.log('');

    // Export audit logs
    console.log('📊 Exporting audit logs...');
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Exported ${auditLogs.length} audit logs`);

    // Export system config
    console.log('📊 Exporting system config...');
    const systemConfig = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
    console.log(`✓ Exported ${systemConfig.length} system config entries`);

    // Prepare data structure
    const adminData: AdminData = {
      auditLogs,
      systemConfig,
      metadata: {
        exportedAt: new Date().toISOString(),
        auditLogCount: auditLogs.length,
        configCount: systemConfig.length,
      },
    };

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'migration-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    const outputPath = path.join(outputDir, 'admin-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(adminData, null, 2));

    console.log('');
    console.log('✅ Admin data export completed successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log('');
    console.log('📈 Export Summary:');
    console.log(`   - Audit Logs: ${adminData.metadata.auditLogCount}`);
    console.log(`   - System Config: ${adminData.metadata.configCount}`);
    console.log(`   - Exported At: ${adminData.metadata.exportedAt}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error exporting admin data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

exportAdminData();
