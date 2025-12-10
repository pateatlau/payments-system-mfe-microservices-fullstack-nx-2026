#!/usr/bin/env tsx
/**
 * Export Auth Data from Legacy Database
 * 
 * Purpose: Export users and refresh_tokens from mfe_poc2 to auth-data.json
 * Input: mfe_poc2 database (PostgreSQL on port 5436)
 * Output: migration-data/auth-data.json
 * 
 * Usage: pnpm tsx scripts/migration/export-auth-data.ts
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

interface AuthData {
  users: any[];
  refreshTokens: any[];
  metadata: {
    exportedAt: string;
    userCount: number;
    tokenCount: number;
  };
}

async function exportAuthData() {
  try {
    console.log('🚀 Starting Auth Data Export...');
    console.log('📦 Source: mfe_poc2 database (port 5436)');
    console.log('');

    // Export users
    console.log('📊 Exporting users...');
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Exported ${users.length} users`);

    // Export refresh tokens
    console.log('📊 Exporting refresh tokens...');
    const refreshTokens = await prisma.refreshToken.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Exported ${refreshTokens.length} refresh tokens`);

    // Prepare data structure
    const authData: AuthData = {
      users,
      refreshTokens,
      metadata: {
        exportedAt: new Date().toISOString(),
        userCount: users.length,
        tokenCount: refreshTokens.length,
      },
    };

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'migration-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    const outputPath = path.join(outputDir, 'auth-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(authData, null, 2));

    console.log('');
    console.log('✅ Auth data export completed successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log('');
    console.log('📈 Export Summary:');
    console.log(`   - Users: ${authData.metadata.userCount}`);
    console.log(`   - Refresh Tokens: ${authData.metadata.tokenCount}`);
    console.log(`   - Exported At: ${authData.metadata.exportedAt}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error exporting auth data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

exportAuthData();
