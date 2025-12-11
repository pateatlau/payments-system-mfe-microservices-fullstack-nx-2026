
/**
 * IMPORTANT: Do not modify this file.
 * This file allows the app to run without bundling in workspace libraries.
 * Must be contained in the ".nx" folder inside the output path.
 */
const Module = require('module');
const path = require('path');
const fs = require('fs');
const originalResolveFilename = Module._resolveFilename;
const distPath = __dirname;
const manifest = [{"module":"@payments-system/rabbitmq-event-hub","exactMatch":"libs/backend/rabbitmq-event-hub/src/index.js","pattern":"libs/backend/rabbitmq-event-hub/src/index.ts"},{"module":"@mfe-poc/cache","exactMatch":"libs/backend/cache/src/index.js","pattern":"libs/backend/cache/src/index.ts"},{"module":"@mfe-poc/observability","exactMatch":"libs/backend/observability/src/index.js","pattern":"libs/backend/observability/src/index.ts"},{"module":".prisma/auth-client","pattern":"apps/auth-service/node_modules/.prisma/auth-client"},{"module":".prisma/payments-client","pattern":"apps/payments-service/node_modules/.prisma/payments-client"},{"module":".prisma/admin-client","pattern":"apps/admin-service/node_modules/.prisma/admin-client"},{"module":".prisma/profile-client","pattern":"apps/profile-service/node_modules/.prisma/profile-client"},{"module":"@mfe/shared-api-client","exactMatch":"libs/shared-api-client/src/index.js","pattern":"libs/shared-api-client/src/index.ts"},{"module":"@mfe/shared-event-bus","exactMatch":"libs/shared-event-bus/src/index.js","pattern":"libs/shared-event-bus/src/index.ts"},{"module":"@mfe/shared-design-system","exactMatch":"libs/shared-design-system/src/index.js","pattern":"libs/shared-design-system/src/index.ts"},{"module":"shared-utils","exactMatch":"libs/shared-utils/src/index.js","pattern":"libs/shared-utils/src/index.ts"},{"module":"shared-ui","exactMatch":"libs/shared-ui/src/index.js","pattern":"libs/shared-ui/src/index.ts"},{"module":"shared-types","exactMatch":"libs/shared-types/src/index.js","pattern":"libs/shared-types/src/index.ts"},{"module":"shared-auth-store","exactMatch":"libs/shared-auth-store/src/index.js","pattern":"libs/shared-auth-store/src/index.ts"},{"module":"shared-header-ui","exactMatch":"libs/shared-header-ui/src/index.js","pattern":"libs/shared-header-ui/src/index.ts"},{"module":"types","exactMatch":"libs/backend/types/src/index.js","pattern":"libs/backend/types/src/index.ts"},{"module":"utils","exactMatch":"libs/backend/utils/src/index.js","pattern":"libs/backend/utils/src/index.ts"},{"module":"db","exactMatch":"libs/backend/db/src/index.js","pattern":"libs/backend/db/src/index.ts"},{"module":"event-hub","exactMatch":"libs/backend/event-hub/src/index.js","pattern":"libs/backend/event-hub/src/index.ts"},{"module":"backend","exactMatch":"libs/backend/src/index.js","pattern":"libs/backend/src/index.ts"},{"module":"shared-websocket","exactMatch":"libs/shared-websocket/src/index.js","pattern":"libs/shared-websocket/src/index.ts"},{"module":"cache","exactMatch":"libs/backend/cache/src/index.js","pattern":"libs/backend/cache/src/index.ts"}];

Module._resolveFilename = function(request, parent) {
  let found;
  for (const entry of manifest) {
    if (request === entry.module && entry.exactMatch) {
      const entry = manifest.find((x) => request === x.module || request.startsWith(x.module + "/"));
      const candidate = path.join(distPath, entry.exactMatch);
      if (isFile(candidate)) {
        found = candidate;
        break;
      }
    } else {
      const re = new RegExp(entry.module.replace(/\*$/, "(?<rest>.*)"));
      const match = request.match(re);

      if (match?.groups) {
        const candidate = path.join(distPath, entry.pattern.replace("*", ""), match.groups.rest);
        if (isFile(candidate)) {
          found = candidate;
        }
      }

    }
  }
  if (found) {
    const modifiedArguments = [found, ...[].slice.call(arguments, 1)];
    return originalResolveFilename.apply(this, modifiedArguments);
  } else {
    return originalResolveFilename.apply(this, arguments);
  }
};

function isFile(s) {
  try {
    require.resolve(s);
    return true;
  } catch (_e) {
    return false;
  }
}

// Call the user-defined main.
module.exports = require('./apps/auth-service/src/main.js');
