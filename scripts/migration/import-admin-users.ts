#!/usr/bin/env tsx
/**
 * Import Users to Admin Database (Denormalized Copy)
 * 
 * Purpose: Import users from auth-data.json to admin_db for zero-coupling
 * Input: migration-data/auth-data.json
 * Output: admin_db database (PostgreSQL on port 5434)
 * 
 * Note: This creates a denormalized copy of users in admin_db, synchronized via
 * RabbitMQ events in Phase 4. No password hashes are stored (security).
 * 
 * Usage: pnpm tsx scripts/migration/import-admin-users.ts
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

interface AuthData {
  users: any[];
  metadata: any;
}

async function importAdminUsers() {
  try {
    console.log('Starting Admin Users Import (Denormalized Copy)...');
    console.log('Target: admin_db database (port 5434)');
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

    // Import users (without password hashes for security)
    console.log('Importing users to admin_db...');
    let usersImported = 0;
    for (const user of authData.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          // Note: passwordHash NOT imported (security - only in auth_db)
        },
      });
      usersImported++;
    }
    console.log(`Imported ${usersImported} users`);

    console.log('');
    console.log('Admin users import completed successfully!');
    console.log('');
    console.log('Import Summary:');
    console.log(`   - Users Imported: ${usersImported}`);
    console.log(`   - Password Hashes: NOT imported (security)`);
    console.log('');
    console.log('Note: This is a denormalized copy for admin operations.');
    console.log('      User data will be synchronized via RabbitMQ events in Phase 4.');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error importing admin users:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

importAdminUsers();
