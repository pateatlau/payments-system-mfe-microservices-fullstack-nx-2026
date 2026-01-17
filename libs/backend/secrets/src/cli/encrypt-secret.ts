#!/usr/bin/env node
/**
 * CLI Tool for Encrypting Secrets
 *
 * Usage:
 *   npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts <command> [options]
 *
 * Commands:
 *   generate-key     Generate a new master encryption key
 *   encrypt <value>  Encrypt a secret value
 *   decrypt <value>  Decrypt an encrypted value
 *   test            Test encryption/decryption round-trip
 *
 * Environment Variables:
 *   ENCRYPTION_MASTER_KEY - 64-char hex or 44-char base64 master key
 *
 * Examples:
 *   # Generate a new master key
 *   npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts generate-key
 *
 *   # Encrypt a secret
 *   ENCRYPTION_MASTER_KEY=<key> npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts encrypt "my-secret-password"
 *
 *   # Decrypt a secret
 *   ENCRYPTION_MASTER_KEY=<key> npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts decrypt "ENC[local:...]"
 */

import {
  LocalEncryptionProvider,
  SecretsEncryptionManager,
  generateMasterKey,
  isEncrypted,
} from '../lib/encryption';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    printUsage();
    process.exit(1);
  }

  switch (command) {
    case 'generate-key':
      handleGenerateKey();
      break;
    case 'encrypt':
      await handleEncrypt(args[1]);
      break;
    case 'decrypt':
      await handleDecrypt(args[1]);
      break;
    case 'test':
      await handleTest();
      break;
    case 'help':
    case '--help':
    case '-h':
      printUsage();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage() {
  console.log(`
Secrets Encryption CLI

Usage:
  npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts <command> [options]

Commands:
  generate-key     Generate a new master encryption key
  encrypt <value>  Encrypt a secret value
  decrypt <value>  Decrypt an encrypted value
  test            Test encryption/decryption round-trip
  help            Show this help message

Environment Variables:
  ENCRYPTION_MASTER_KEY - Required for encrypt/decrypt commands
                          64-char hex or 44-char base64 master key

Examples:
  # Generate a new master key
  npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts generate-key

  # Set the key and encrypt a secret
  export ENCRYPTION_MASTER_KEY=$(npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts generate-key | tail -1)
  npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts encrypt "my-database-password"

  # Encrypt directly with key
  ENCRYPTION_MASTER_KEY=<key> npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts encrypt "secret"
`);
}

function handleGenerateKey() {
  const key = generateMasterKey();
  console.log('Generated new master encryption key (256-bit AES):');
  console.log('');
  console.log('Add this to your environment:');
  console.log(`  export ENCRYPTION_MASTER_KEY="${key}"`);
  console.log('');
  console.log('Or add to .env file:');
  console.log(`  ENCRYPTION_MASTER_KEY=${key}`);
  console.log('');
  console.log('Key (hex format):');
  console.log(key);
}

async function handleEncrypt(value: string | undefined) {
  if (!value) {
    console.error('Error: Value to encrypt is required');
    console.error('Usage: encrypt <value>');
    process.exit(1);
  }

  const masterKey = process.env['ENCRYPTION_MASTER_KEY'];
  if (!masterKey) {
    console.error('Error: ENCRYPTION_MASTER_KEY environment variable is required');
    console.error('');
    console.error('Generate a key first:');
    console.error('  npx ts-node libs/backend/secrets/src/cli/encrypt-secret.ts generate-key');
    process.exit(1);
  }

  try {
    const manager = createManager(masterKey);
    const encrypted = await manager.encrypt(value);
    console.log('Encrypted value:');
    console.log(encrypted);
  } catch (error) {
    console.error('Encryption failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleDecrypt(value: string | undefined) {
  if (!value) {
    console.error('Error: Value to decrypt is required');
    console.error('Usage: decrypt <encrypted-value>');
    process.exit(1);
  }

  if (!isEncrypted(value)) {
    console.error('Error: Value does not appear to be encrypted');
    console.error('Expected format: ENC[provider:base64data]');
    process.exit(1);
  }

  const masterKey = process.env['ENCRYPTION_MASTER_KEY'];
  if (!masterKey) {
    console.error('Error: ENCRYPTION_MASTER_KEY environment variable is required');
    process.exit(1);
  }

  try {
    const manager = createManager(masterKey);
    const decrypted = await manager.decrypt(value);
    console.log('Decrypted value:');
    console.log(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleTest() {
  console.log('Testing encryption/decryption...');
  console.log('');

  // Generate a test key
  const testKey = generateMasterKey();
  console.log('Generated test key:', testKey.substring(0, 16) + '...');

  // Create manager
  const manager = createManager(testKey);

  // Test values
  const testValues = [
    'simple-password',
    'password-with-special-chars!@#$%^&*()',
    'unicode-密码-🔐',
    'very-long-' + 'x'.repeat(1000),
    '',
  ];

  let passed = 0;
  let failed = 0;

  for (const original of testValues) {
    try {
      const encrypted = await manager.encrypt(original);
      const decrypted = await manager.decrypt(encrypted);

      if (decrypted === original) {
        console.log(`✓ Test passed: "${original.substring(0, 30)}${original.length > 30 ? '...' : ''}"`);
        passed++;
      } else {
        console.log(`✗ Test failed: mismatch for "${original.substring(0, 30)}..."`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ Test failed: ${error instanceof Error ? error.message : error}`);
      failed++;
    }
  }

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

function createManager(masterKey: string): SecretsEncryptionManager {
  const provider = new LocalEncryptionProvider(masterKey, 'cli');
  const manager = new SecretsEncryptionManager({ serviceName: 'cli' });
  manager.registerProvider(provider, true);
  return manager;
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
