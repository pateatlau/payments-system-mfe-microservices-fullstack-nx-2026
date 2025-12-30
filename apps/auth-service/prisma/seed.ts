/**
 * Auth Service Seed Script
 *
 * Seeds the auth database with test users for E2E testing.
 * Uses upsert to handle existing data gracefully.
 *
 * Run with: pnpm db:auth:seed
 */

import { PrismaClient, UserRole } from '.prisma/auth-client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding auth database...');

  const passwordHash = await bcrypt.hash('TestPassword123!', 10);

  // Create/update customer user
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: { passwordHash }, // Update password in case it changed
    create: {
      email: 'customer@example.com',
      passwordHash,
      name: 'Customer User',
      role: UserRole.CUSTOMER,
      emailVerified: true,
    },
  });
  console.log(`✅ Customer user: ${customerUser.email}`);

  // Create/update vendor user
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@example.com' },
    update: { passwordHash },
    create: {
      email: 'vendor@example.com',
      passwordHash,
      name: 'Vendor User',
      role: UserRole.VENDOR,
      emailVerified: true,
    },
  });
  console.log(`✅ Vendor user: ${vendorUser.email}`);

  // Create/update admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash },
    create: {
      email: 'admin@example.com',
      passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user: ${adminUser.email}`);

  console.log('✨ Auth database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding auth database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
