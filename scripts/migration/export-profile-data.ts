#!/usr/bin/env tsx
/**
 * Export Profile Data from Legacy Database
 * 
 * Purpose: Export user_profiles from mfe_poc2 to profile-data.json
 * Input: mfe_poc2 database (PostgreSQL on port 5436)
 * Output: migration-data/profile-data.json
 * 
 * Usage: pnpm tsx scripts/migration/export-profile-data.ts
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

interface ProfileData {
  userProfiles: any[];
  metadata: {
    exportedAt: string;
    profileCount: number;
  };
}

async function exportProfileData() {
  try {
    console.log('🚀 Starting Profile Data Export...');
    console.log('📦 Source: mfe_poc2 database (port 5436)');
    console.log('');

    // Export user profiles
    console.log('📊 Exporting user profiles...');
    const userProfiles = await prisma.userProfile.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Exported ${userProfiles.length} user profiles`);

    // Prepare data structure
    const profileData: ProfileData = {
      userProfiles,
      metadata: {
        exportedAt: new Date().toISOString(),
        profileCount: userProfiles.length,
      },
    };

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'migration-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    const outputPath = path.join(outputDir, 'profile-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(profileData, null, 2));

    console.log('');
    console.log('✅ Profile data export completed successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log('');
    console.log('📈 Export Summary:');
    console.log(`   - User Profiles: ${profileData.metadata.profileCount}`);
    console.log(`   - Exported At: ${profileData.metadata.exportedAt}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error exporting profile data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

exportProfileData();
