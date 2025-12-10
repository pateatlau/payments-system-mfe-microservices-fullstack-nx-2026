#!/usr/bin/env tsx
/**
 * Import Profile Data to Profile Database
 * 
 * Purpose: Import user_profiles from profile-data.json to profile_db
 * Input: migration-data/profile-data.json
 * Output: profile_db database (PostgreSQL on port 5435)
 * 
 * Usage: pnpm tsx scripts/migration/import-profile-data.ts
 */

import { PrismaClient } from '../../../apps/profile-service/node_modules/.prisma/profile-client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PROFILE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5435/profile_db',
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

async function importProfileData() {
  try {
    console.log('🚀 Starting Profile Data Import...');
    console.log('📦 Target: profile_db database (port 5435)');
    console.log('');

    // Read data file
    const dataPath = path.join(process.cwd(), 'migration-data', 'profile-data.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found: ${dataPath}`);
    }

    const profileData: ProfileData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📊 Data Source: ${profileData.metadata.exportedAt}`);
    console.log(`   - User Profiles: ${profileData.metadata.profileCount}`);
    console.log('');

    // Import user profiles
    console.log('📥 Importing user profiles...');
    let profilesImported = 0;
    for (const profile of profileData.userProfiles) {
      await prisma.userProfile.create({
        data: {
          id: profile.id,
          userId: profile.userId,
          avatarUrl: profile.avatarUrl,
          phone: profile.phone,
          address: profile.address,
          bio: profile.bio,
          preferences: profile.preferences,
          createdAt: new Date(profile.createdAt),
          updatedAt: new Date(profile.updatedAt),
        },
      });
      profilesImported++;
    }
    console.log(`✓ Imported ${profilesImported} user profiles`);

    console.log('');
    console.log('✅ Profile data import completed successfully!');
    console.log('');
    console.log('📈 Import Summary:');
    console.log(`   - User Profiles Imported: ${profilesImported}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing profile data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

importProfileData();
