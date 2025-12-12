// Fix Module Resolution for TypeScript Libraries
// This script fixes the generated main.js files to properly fall back to .ts files
// and registers tsx loader for TypeScript support

const fs = require('fs');
const path = require('path');

const services = [
  'auth-service',
  'payments-service',
  'admin-service',
  'profile-service',
  'api-gateway',
];

services.forEach(service => {
  // Fix both dist/apps and tmp locations (tmp is used by nx serve)
  const mainJsPaths = [
    path.join(__dirname, `../dist/apps/${service}/main.js`),
    path.join(__dirname, `../tmp/${service}/main-with-require-overrides.js`),
  ];

  mainJsPaths.forEach(mainJsPath => {
    if (!fs.existsSync(mainJsPath)) {
      console.log(`Skipping ${service} - main.js not found`);
      return;
    }

    let content = fs.readFileSync(mainJsPath, 'utf8');

    // Check if already fixed
    if (
      content.includes('// Fallback to pattern (.ts file)') &&
      content.includes('// Register TypeScript loader')
    ) {
      console.log(`${service} - already fixed`);
      return;
    }

    let modified = false;

    // 1. Register TypeScript loader (tsx) at the beginning if not already registered
    if (!content.includes('// Register TypeScript loader')) {
      const tsxRegistration = `
// Register TypeScript loader for .ts file imports
try {
  require('tsx/cjs/api').register({
    tsconfig: {
      compilerOptions: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  });
} catch (_e) {
  // tsx not available, TypeScript files won't work
}`;
      content = content.replace(
        /const distPath = __dirname;/,
        `const distPath = __dirname;${tsxRegistration}`
      );
      modified = true;
    }

    // 1b. Fix distPath for tmp folder (needs to be workspace root)
    if (
      mainJsPath.includes('/tmp/') &&
      content.includes('const distPath = __dirname;')
    ) {
      content = content.replace(
        /const distPath = __dirname;/,
        `const distPath = path.resolve(__dirname, '../..');`
      );
      modified = true;
    }

    // Fix the module resolution to fall back to .ts files
    const oldPattern =
      /if \(request === entry\.module && entry\.exactMatch\) \{[\s\S]*?break;\s*\}/;
    const newCode = `if (request === entry.module && entry.exactMatch) {
      const entry2 = manifest.find((x) => request === x.module || request.startsWith(x.module + "/"));
      if (entry2) {
        // Try exactMatch (.js file) first
        const candidate = path.join(distPath, entry2.exactMatch);
        if (isFile(candidate)) {
          found = candidate;
          break;
        }
        // Fallback to pattern (.ts file) if exactMatch doesn't exist
        if (entry2.pattern) {
          const patternCandidate = path.join(distPath, entry2.pattern);
          if (fs.existsSync(patternCandidate)) {
            found = patternCandidate;
            break;
          }
        }
      }
    }`;

    // Fix isFile function
    const oldIsFilePattern =
      /function isFile\(s\) \{[\s\S]*?return false;[\s\S]*?\}/;
    const newIsFile = `function isFile(s) {
  try {
    require.resolve(s);
    return true;
  } catch (_e) {
    // Fallback: check if file exists using fs (for TypeScript files)
    try {
      return fs.existsSync(s);
    } catch (_e2) {
      return false;
    }
  }
}`;

    // 2. Fix extra closing brace if present
    content = content.replace(
      /\}\s*\}\s*module\.exports/g,
      '}\nmodule.exports'
    );

    // 3. Add fallback to .ts files if not already present
    if (!content.includes('// Fallback to pattern (.ts file)')) {
      // Match the Nx-generated pattern - simpler and more reliable regex
      // Looking for the block that has: const entry = manifest.find... followed by exactMatch check
      const oldBlockPattern =
        /if \(request === entry\.module && entry\.exactMatch\) \{\s*const entry = manifest\.find\(\(x\) => request === x\.module \|\| request\.startsWith\(x\.module \+ "\/"\)\);\s*const candidate = path\.join\(distPath, entry\.exactMatch\);\s*if \(isFile\(candidate\)\) \{\s*found = candidate;\s*break;\s*\}\s*\}/;

      if (oldBlockPattern.test(content)) {
        content = content.replace(
          oldBlockPattern,
          `if (request === entry.module && entry.exactMatch) {
      const entry2 = manifest.find((x) => request === x.module || request.startsWith(x.module + "/"));
      if (entry2) {
        // Try exactMatch (.js file) first
        const candidate = path.join(distPath, entry2.exactMatch);
        if (isFile(candidate)) {
          found = candidate;
          break;
        }
        // Fallback to pattern (.ts file) if exactMatch doesn't exist
        if (entry2.pattern) {
          const patternCandidate = path.join(distPath, entry2.pattern);
          if (fs.existsSync(patternCandidate)) {
            found = patternCandidate;
            break;
          }
        }
      }
    }`
        );
        modified = true;
      }
    }

    // 4. Update isFile function to check fs.existsSync if not already updated
    if (!content.includes('// Fallback: check if file exists using fs')) {
      content = content.replace(
        /function isFile\(s\) \{\s*try \{\s*require\.resolve\(s\);\s*return true;\s*\} catch \(_e\) \{\s*return false;\s*\}\s*\}/,
        `function isFile(s) {
  try {
    require.resolve(s);
    return true;
  } catch (_e) {
    // Fallback: check if file exists using fs (for TypeScript files)
    try {
      return fs.existsSync(s);
    } catch (_e2) {
      return false;
    }
  }
}`
      );
      modified = true;
    }

    // 5. Fix module.exports to use correct service path
    // Different paths for dist vs tmp folders
    // tmp folder: use TypeScript source (.ts) with relative path ../../apps/{service}/src/main.ts
    // dist folder: use compiled JavaScript (.js) with relative path ./apps/{service}/src/main.js
    const isInTmp = mainJsPath.includes('/tmp/');
    const correctRequire = isInTmp
      ? `module.exports = require('../../apps/${service}/src/main.ts');`
      : `module.exports = require('./apps/${service}/src/main.js');`;

    // Match various possible require patterns
    const requirePattern =
      /module\.exports = require\(["']\.\.?\/?(\.\.\/)?apps\/[^\/]+\/src\/main\.(js|ts)["']\);?/;
    if (requirePattern.test(content)) {
      content = content.replace(requirePattern, correctRequire);
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(mainJsPath, content, 'utf8');
      console.log(
        `✅ Fixed ${path.basename(path.dirname(mainJsPath))}/${path.basename(mainJsPath)}`
      );
    } else {
      fs.writeFileSync(mainJsPath, content, 'utf8'); // Save anyway to fix module.exports path
      console.log(
        `  ${path.basename(path.dirname(mainJsPath))}/${path.basename(mainJsPath)} - already fixed (verified)`
      );
    }
  });
});

console.log('\nModule resolution fix complete');
