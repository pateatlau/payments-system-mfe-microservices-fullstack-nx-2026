/**
 * Prisma Seed Script
 *
 * Seeds the database with initial test data for development and testing.
 *
 * Run with: pnpm prisma db seed
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (for development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Clearing existing data...');
    await prisma.paymentTransaction.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.systemConfig.deleteMany();
    await prisma.user.deleteMany();
  }

  // Hash password for test users
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);

  // Create test users
  console.log('Creating test users...');

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash,
      name: 'Customer User',
      role: UserRole.CUSTOMER,
      emailVerified: true,
    },
  });

  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor@example.com',
      passwordHash,
      name: 'Vendor User',
      role: UserRole.VENDOR,
      emailVerified: true,
    },
  });

  console.log(
    `✅ Created users: ${adminUser.email}, ${customerUser.email}, ${vendorUser.email}`
  );

  // Create user profiles
  console.log('Creating user profiles...');

  await prisma.userProfile.create({
    data: {
      userId: adminUser.id,
      phone: '+1234567890',
      address: '123 Admin Street',
      bio: 'System Administrator',
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: customerUser.id,
      phone: '+1234567891',
      preferences: {
        theme: 'light',
        notifications: true,
      },
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: vendorUser.id,
      phone: '+1234567892',
      address: '456 Vendor Avenue',
      preferences: {
        theme: 'light',
        notifications: false,
      },
    },
  });

  console.log('✅ Created user profiles');

  // Create sample payments
  console.log('Creating sample payments...');

  const payment1 = await prisma.payment.create({
    data: {
      senderId: customerUser.id,
      recipientId: vendorUser.id,
      amount: 1000.0,
      currency: 'USD',
      status: 'completed',
      type: 'instant',
      description: 'Sample instant payment',
      completedAt: new Date(),
      metadata: {
        source: 'test',
      },
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      senderId: vendorUser.id,
      recipientId: customerUser.id,
      amount: 500.0,
      currency: 'USD',
      status: 'pending',
      type: 'scheduled',
      description: 'Sample scheduled payment',
      metadata: {
        source: 'test',
      },
    },
  });

  console.log(`✅ Created payments: ${payment1.id}, ${payment2.id}`);

  // Create payment transactions
  console.log('Creating payment transactions...');

  await prisma.paymentTransaction.create({
    data: {
      paymentId: payment1.id,
      status: 'completed',
      statusMessage: 'Payment completed successfully',
      pspTransactionId: 'PSP_TX_123',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
  });

  await prisma.paymentTransaction.create({
    data: {
      paymentId: payment2.id,
      status: 'pending',
      statusMessage: 'Payment initiated',
      pspTransactionId: 'PSP_TX_456',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log('✅ Created payment transactions');

  // Create system config
  console.log('Creating system configuration...');

  await prisma.systemConfig.create({
    data: {
      key: 'app.version',
      value: '1.0.0',
      description: 'Application version',
      updatedBy: adminUser.id,
    },
  });

  await prisma.systemConfig.create({
    data: {
      key: 'payment.min_amount',
      value: 0.01,
      description: 'Minimum payment amount',
      updatedBy: adminUser.id,
    },
  });

  console.log('✅ Created system configuration');

  // Create sample audit logs
  console.log('Creating sample audit logs...');

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'user.created',
      resourceType: 'user',
      resourceId: customerUser.id,
      details: {
        email: customerUser.email,
        role: customerUser.role,
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Prisma Seed Script',
    },
  });

  console.log('✅ Created audit logs');

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
