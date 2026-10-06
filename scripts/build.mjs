#!/usr/bin/env node
// Builds manifest.json from brand.json + modules/*.meta.json, then validates
// every module against CONVENTIONS.md. Exits non-zero on any error.
//   node scripts/build.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = JSON.parse(readFileSync(join(root, 'brand.json'), 'utf8'));
const modDir = join(root, 'modules');
const errors = [];
const warnings = [];

const htmlIds = readdirSync(modDir).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5));
const metaIds = readdirSync(modDir).filter(f => f.endsWith('.meta.json')).map(f => f.slice(0, -10));
for (const id of htmlIds) if (!metaIds.includes(id)) errors.push(`${id}: missing ${id}.meta.json`);
for (const id of metaIds) if (!htmlIds.includes(id)) errors.push(`${id}: missing ${id}.html`);

const catIds = brand.categories.map(c => c.id);

// Allowed classes = every class selector defined in email-head.css (the plugin's ADC
// stylesheet + the dark-mode add-on) plus SFMC's block-wrapper classes.
const headCss = readFileSync(join(root, 'email-head.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const allowed = new Set([...headCss.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(m => m[1]));
for (const c of ['stylingblock-content-wrapper', 'camarker-inner']) allowed.add(c);
const modules = [];
let total = 0;
for (const id of metaIds.filter(i => htmlIds.includes(i))) {
  let meta;
  try { meta = JSON.parse(readFileSync(join(modDir, `${id}.meta.json`), 'utf8')); }
  catch (e) { errors.push(`${id}: invalid meta JSON (${e.message})`); continue; }
  if (meta.id !== id) errors.push(`${id}: meta.id is "${meta.id}"`);
  if (!catIds.includes(meta.category)) errors.push(`${id}: unknown category "${meta.category}"`);
  for (const k of ['title', 'description', 'figmaNode']) if (!meta[k]) errors.push(`${id}: meta.${k} missing`);

  const html = readFileSync(join(modDir, `${id}.html`), 'utf8');
  // Strip HTML comments (but keep Outlook conditional blocks) before tag checks.
  const code = html.replace(/<!--(?!\[if)(?!<!\[endif)[\s\S]*?-->/g, '');
  const bytes = Buffer.byteLength(html);
  total += bytes;
  meta.bytes = bytes;
  if (bytes > 20000) warnings.push(`${id}: ${(bytes / 1024).toFixed(1)} KB (target < 20 KB)`);
  if (!html.trimStart().startsWith(`<!-- MFS · ${id}`)) errors.push(`${id}: missing "<!-- MFS · ${id} …" header comment`);
  if (/<\/?(html|head|body|style|script|div)\b/i.test(code)) errors.push(`${id}: contains html/head/body/style/script/div tag`);
  if (/display\s*:\s*(flex|grid)|(?<![-\w])gap\s*:|position\s*:\s*(absolute|relative|fixed)|float\s*:/i.test(html)) errors.push(`${id}: uses flex/grid/gap/position/float`);
  if (/figma\.com\/api\/mcp/i.test(html)) errors.push(`${id}: still references a temporary Figma asset URL`);
  if (!/^\s*<table\b[^>]*class="stylingblock-content-wrapper/.test(code.trimStart())) errors.push(`${id}: must start with a <table class="stylingblock-content-wrapper …"> section wrapper`);
  const unknown = new Set();
  for (const m of code.matchAll(/\sclass="([^"]*)"/g)) for (const c of m[1].split(/\s+/).filter(Boolean)) if (!allowed.has(c)) unknown.add(c);
  if (unknown.size) errors.push(`${id}: classes not in email-head.css: ${[...unknown].join(', ')}`);
  for (const tag of code.match(/<table\b[^>]*>/gi) || []) {
    if (!/role="presentation"/.test(tag) && !/data-table/.test(tag)) errors.push(`${id}: table without role="presentation": ${tag.slice(0, 80)}`);
  }
  for (const tag of code.match(/<img\b[^>]*>/gi) || []) {
    const src = (tag.match(/src="([^"]*)"/) || [])[1];
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) errors.push(`${id}: img missing width/height: ${src}`);
    if (!/\salt="/.test(tag)) errors.push(`${id}: img missing alt: ${src}`);
    if (src && !/^https?:/.test(src)) {
      const p = join(root, src);
      if (!existsSync(p) || statSync(p).size === 0) errors.push(`${id}: image not found: ${src}`);
    }
  }
  if (!/font-family:\s*Calibri/i.test(html) && /<td[^>]*>[^<\s]/.test(html)) warnings.push(`${id}: no Calibri font-family found`);
  modules.push(meta);
}

const order = Object.fromEntries(catIds.map((c, i) => [c, i]));
modules.sort((a, b) => (order[a.category] - order[b.category]) || a.id.localeCompare(b.id, 'en', { numeric: true }));
const manifest = { ...brand, modules, built: new Date().toISOString() };
writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

for (const w of warnings) console.warn('warn ', w);
for (const e of errors) console.error('error', e);
const counts = catIds.map(c => `${c} ${modules.filter(m => m.category === c).length}`).join(' · ');
console.log(`manifest.json: ${modules.length} modules (${counts}), ${(total / 1024).toFixed(1)} KB of module HTML`);
process.exit(errors.length ? 1 : 0);
