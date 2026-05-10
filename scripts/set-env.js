// Generates environment files from .env.local (dev) or process.env (CI/production).
// Run automatically via prestart/prebuild npm hooks.
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('=').map(s => s.trim()))
      .filter(([k]) => k)
      .map(([k, ...v]) => [k, v.join('=')])
  );
}

const env = { ...loadEnvLocal(), ...process.env };

const get = (key) => {
  const val = env[key];
  if (!val || val === 'REPLACE_WITH_GOOGLE_CLIENT_ID') {
    console.warn(`[set-env] WARNING: ${key} não está definido.`);
    return '';
  }
  return val;
};

// CI é setado automaticamente por Netlify, Railway, Fly.io, GitHub Actions, etc.
const isCI = !!process.env.CI;

const apiUrl = isCI
  ? (get('API_URL') || 'https://cortex-api-2rvh-g.fly.dev')
  : 'http://localhost:5259';

const googleClientId = get('GOOGLE_CLIENT_ID');

const content = `export const environment = {
  apiUrl: '${apiUrl}',
  googleClientId: '${googleClientId}',
};
`;

const target = isCI
  ? path.resolve(__dirname, '../src/environments/environment.ts')
  : path.resolve(__dirname, '../src/environments/environment.development.ts');

fs.writeFileSync(target, content);
console.log(`[set-env] ${path.basename(target)} gerado (${isCI ? 'CI' : 'local'}).`);
