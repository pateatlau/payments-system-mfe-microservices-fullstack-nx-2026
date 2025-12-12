#!/usr/bin/env tsx
/**
 * Import Auth Data to Auth Database
 * 
 * Purpose: Import users and refresh_tokens from auth-data.json to auth_db
 * Input: migration-data/auth-data.json
 * Output: auth_db database (PostgreSQL on port 5432)
 * 
 * Usage: pnpm tsx scripts/migration/import-auth-data.ts
 */

import { PrismaClient } from '../../apps/auth-service/node_modules/.prisma/auth-client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.AUTH_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_db',
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

async function importAuthData() {
  try {
    console.log('🚀 Starting Auth Data Import...');
    console.log('📦 Target: auth_db database (port 5432)');
    console.log('');

    // Read data file
    const dataPath = path.join(process.cwd(), 'migration-data', 'auth-data.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found: ${dataPath}`);
    }

    const authData: AuthData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📊 Data Source: ${authData.metadata.exportedAt}`);
    console.log(`   - Users: ${authData.metadata.userCount}`);
    console.log(`   - Refresh Tokens: ${authData.metadata.tokenCount}`);
    console.log('');

    // Import users
    console.log('📥 Importing users...');
    let usersImported = 0;
    for (const user of authData.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
      usersImported++;
    }
    console.log(`✓ Imported ${usersImported} users`);

    // Import refresh tokens
    console.log('📥 Importing refresh tokens...');
    let tokensImported = 0;
    for (const token of authData.refreshTokens) {
      await prisma.refreshToken.create({
        data: {
          id: token.id,
          userId: token.userId,
          token: token.token,
          expiresAt: new Date(token.expiresAt),
          createdAt: new Date(token.createdAt),
        },
      });
      tokensImported++;
    }
    console.log(`✓ Imported ${tokensImported} refresh tokens`);

    console.log('');
    console.log('✅ Auth data import completed successfully!');
    console.log('');
    console.log('📈 Import Summary:');
    console.log(`   - Users Imported: ${usersImported}`);
    console.log(`   - Refresh Tokens Imported: ${tokensImported}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing auth data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

importAuthData();
