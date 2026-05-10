import fs from 'fs';
import path from 'path';

function findTwoFactorClient() {
  const possiblePaths = [
    'node_modules/better-auth/dist/plugins/two-factor-auth/client.d.ts',
    'node_modules/better-auth/dist/client/plugins/index.d.ts',
    'node_modules/better-auth/dist/plugins/two-factor/client.d.ts',
    'node_modules/better-auth/dist/plugins/two-factor/index.d.ts',
    'node_modules/better-auth/plugins/two-factor.d.ts'
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`Found: ${p}`);
      console.log(fs.readFileSync(p, 'utf8').substring(0, 2000));
    }
  }
}

findTwoFactorClient();
