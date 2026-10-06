#!/usr/bin/env node
// Sets the site password. Only its SHA-256 hash is written into site.js.
//   node scripts/set-password.mjs 'new password'
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pw = process.argv[2];
if (!pw) { console.error("usage: node scripts/set-password.mjs 'password'"); process.exit(1); }
const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'site.js');
const hash = createHash('sha256').update(pw, 'utf8').digest('hex');
const src = readFileSync(file, 'utf8');
const out = src.replace(/var PASSWORD_SHA256 = '[0-9a-f]*';/, `var PASSWORD_SHA256 = '${hash}';`);
if (out === src && !src.includes(hash)) { console.error('PASSWORD_SHA256 line not found in site.js'); process.exit(1); }
writeFileSync(file, out);
console.log('Password updated. Visitors who already unlocked this tab stay unlocked until they close it.');
