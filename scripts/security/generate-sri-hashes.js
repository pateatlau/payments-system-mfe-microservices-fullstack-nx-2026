/**
 * SRI Hash Generator for Module Federation Remotes
 *
 * Generates Subresource Integrity (SRI) hashes for remoteEntry.js files
 * to enable integrity verification of federated modules at runtime.
 *
 * Security Benefits:
 * - Detects tampering of remote entries during transit (MITM attacks)
 * - Ensures only expected code is loaded by the shell app
 * - Provides cryptographic proof of file integrity
 *
 * Usage:
 *   node scripts/security/generate-sri-hashes.js
 *
 * Output:
 *   - dist/sri-manifest.json - JSON manifest with hashes for all remotes
 *   - Console output of generated hashes
 *
 * Post-build Integration:
 *   Add to package.json scripts:
 *   "build:remotes:sri": "pnpm build:remotes && node scripts/security/generate-sri-hashes.js"
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Remote MFE configuration
const REMOTES = [
  { name: 'authMfe', path: 'auth-mfe' },
  { name: 'paymentsMfe', path: 'payments-mfe' },
  { name: 'adminMfe', path: 'admin-mfe' },
  { name: 'profileMfe', path: 'profile-mfe' },
];

// Hash algorithm - SHA-384 is standard for SRI
// SHA-384 provides good security margin while being faster than SHA-512
const HASH_ALGORITHM = 'sha384';

// Base path for dist output
const DIST_PATH = path.resolve(__dirname, '../../dist/apps');
const MANIFEST_OUTPUT = path.resolve(__dirname, '../../dist/sri-manifest.json');

/**
 * Generate SRI hash for a file
 * @param {string} filePath - Path to the file
 * @returns {string|null} - SRI hash in format "sha384-{base64}" or null if file not found
 */
function generateSRIHash(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash(HASH_ALGORITHM).update(content).digest('base64');

    return `${HASH_ALGORITHM}-${hash}`;
  } catch (error) {
    console.error(`❌ Error generating hash for ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get file size in bytes and human-readable format
 * @param {string} filePath - Path to the file
 * @returns {{ bytes: number, readable: string }} - File size info
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const bytes = stats.size;
    const kb = (bytes / 1024).toFixed(2);
    return { bytes, readable: `${kb} KB` };
  } catch {
    return { bytes: 0, readable: 'N/A' };
  }
}

/**
 * Generate SRI manifest for all remote MFEs
 * @returns {object} - Manifest object with hashes and metadata
 */
function generateManifest() {
  const manifest = {
    version: '1.0.0',
    algorithm: HASH_ALGORITHM,
    generatedAt: new Date().toISOString(),
    remotes: {},
  };

  let hasErrors = false;

  console.log('\n🔒 Generating SRI Hashes for Module Federation Remotes\n');
  console.log(`Algorithm: ${HASH_ALGORITHM.toUpperCase()}`);
  console.log(`Dist Path: ${DIST_PATH}\n`);
  console.log('─'.repeat(70));

  for (const remote of REMOTES) {
    const remoteEntryPath = path.join(DIST_PATH, remote.path, 'remoteEntry.js');
    const hash = generateSRIHash(remoteEntryPath);
    const size = getFileSize(remoteEntryPath);

    if (hash) {
      manifest.remotes[remote.name] = {
        path: `${remote.path}/remoteEntry.js`,
        integrity: hash,
        size: size.bytes,
        lastModified: fs.statSync(remoteEntryPath).mtime.toISOString(),
      };

      console.log(`✅ ${remote.name.padEnd(15)} | ${size.readable.padStart(10)} | ${hash.substring(0, 50)}...`);
    } else {
      hasErrors = true;
      manifest.remotes[remote.name] = {
        path: `${remote.path}/remoteEntry.js`,
        integrity: null,
        error: 'File not found or unreadable',
      };

      console.log(`❌ ${remote.name.padEnd(15)} | ${'N/A'.padStart(10)} | ERROR: File not found`);
    }
  }

  console.log('─'.repeat(70));

  return { manifest, hasErrors };
}

/**
 * Write manifest to output file
 * @param {object} manifest - Manifest object to write
 */
function writeManifest(manifest) {
  // Ensure dist directory exists
  const distDir = path.dirname(MANIFEST_OUTPUT);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(MANIFEST_OUTPUT, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\n📄 Manifest written to: ${MANIFEST_OUTPUT}`);
}

/**
 * Also generate a TypeScript constants file for compile-time usage
 */
function writeTypescriptConstants(manifest) {
  const tsOutput = path.resolve(__dirname, '../../libs/shared-utils/src/lib/sri-hashes.generated.ts');

  const remoteHashes = Object.entries(manifest.remotes)
    .filter(([, data]) => data.integrity)
    .map(([name, data]) => `  '${name}': '${data.integrity}'`)
    .join(',\n');

  const content = `/**
 * Auto-generated SRI hashes for Module Federation remotes
 * Generated at: ${manifest.generatedAt}
 * Algorithm: ${manifest.algorithm}
 *
 * DO NOT EDIT - This file is auto-generated by scripts/security/generate-sri-hashes.js
 * Run 'pnpm build:remotes:sri' to regenerate
 */

export const SRI_ALGORITHM = '${manifest.algorithm}' as const;

export const SRI_GENERATED_AT = '${manifest.generatedAt}' as const;

export const REMOTE_INTEGRITY_HASHES = {
${remoteHashes}
} as const;

export type RemoteName = keyof typeof REMOTE_INTEGRITY_HASHES;

/**
 * Get the SRI hash for a remote MFE
 * @param remoteName - Name of the remote (e.g., 'authMfe')
 * @returns SRI hash string or undefined if not found
 */
export function getRemoteIntegrityHash(remoteName: string): string | undefined {
  if (remoteName in REMOTE_INTEGRITY_HASHES) {
    return REMOTE_INTEGRITY_HASHES[remoteName as RemoteName];
  }
  return undefined;
}
`;

  fs.writeFileSync(tsOutput, content, 'utf8');
  console.log(`📄 TypeScript constants written to: ${tsOutput}`);
}

// Main execution
function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  Module Federation SRI Hash Generator');
  console.log('═'.repeat(70));

  const { manifest, hasErrors } = generateManifest();

  writeManifest(manifest);
  writeTypescriptConstants(manifest);

  if (hasErrors) {
    console.log('\n⚠️  Some remotes failed to hash. Build remotes first:');
    console.log('   pnpm build:remotes');
    process.exit(1);
  } else {
    console.log('\n✅ All SRI hashes generated successfully!');
    console.log('\nUsage in Shell app:');
    console.log('  import { verifyRemoteIntegrity } from "@mfe/shared-utils";');
    console.log('  const isValid = await verifyRemoteIntegrity("authMfe", remoteUrl);');
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

main();
