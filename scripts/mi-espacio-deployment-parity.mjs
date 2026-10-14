#!/usr/bin/env node
/**
 * Verify only public, non-authenticated Mi Espacio frontend assets.
 * Never submit cookies, bearer tokens, user identities or API data.
 * Usage: node scripts/mi-espacio-deployment-parity.mjs https://desk.neumact.org/
 */
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const ASSET_PATHS = Object.freeze([
  'mi-espacio/mi-espacio.css',
  'mi-espacio/mi-espacio.js'
]);

export function findAssets(html) {
  const assets = new Map();
  if (typeof html !== 'string') return assets;
  // Extract links and script URLs, never execute or inspect application/user data.
  for (const match of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1], 'https://asset-check.invalid/');
      const path = url.pathname.replace(/^\/+/, '');
      if (ASSET_PATHS.includes(path) && !assets.has(path)) {
        assets.set(path, { reference: match[1], version: url.searchParams.get('v') || '' });
      }
    } catch { /* Ignore malformed unrelated links. */ }
  }
  return assets;
}

export function compareVersions(localHtml, deployedHtml) {
  const local = findAssets(localHtml), deployed = findAssets(deployedHtml);
  return ASSET_PATHS.map(path => ({
    path,
    local: local.get(path)?.version || null,
    deployed: deployed.get(path)?.version || null,
    reference: deployed.get(path)?.reference || null,
    match: Boolean(local.get(path)?.version) &&
      local.get(path)?.version === deployed.get(path)?.version
  }));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function checkLive(urlArg) {
  const base = new URL(urlArg || 'https://desk.neumact.org/');
  if (!['https:', 'http:'].includes(base.protocol)) throw new Error('Only http(s) deployments are supported');
  if (base.username || base.password || base.search || base.hash) {
    throw new Error('Use a public origin URL without credentials, parameters or fragments');
  }
  console.log('Checking public frontend asset parity (no login or personal data).');
  const repoRoot = resolve(new URL('..', import.meta.url).pathname);
  const localHtml = await readFile(resolve(repoRoot, 'index.html'), 'utf8');
  const response = await fetch(base, {signal: AbortSignal.timeout(15000), headers: {'Accept':'text/html'}});
  if (!response.ok) throw new Error('Frontend returned HTTP '+response.status);
  const effective = new URL(response.url);
  if (effective.origin !== base.origin) throw new Error('Redirected to another origin; public check stopped');
  const deployedHtml = await response.text();
  const results = compareVersions(localHtml, deployedHtml);
  let failed = false;

  for (const result of results) {
    console.log('\n'+result.path);
    console.log('  local version:   '+(result.local || 'not found'));
    console.log('  deployed version:'+(result.deployed ? ' '+result.deployed : ' not found'));
    if (!result.match) {
      failed = true;
      console.log('  RESULT: VERSION MISMATCH or unavailable asset. Verify deployment, service worker and browser cache.');
      continue;
    }
    // A matching ?v= is not enough if the CDN still serves obsolete bytes.
    const assetUrl = new URL(result.reference, effective);
    if (assetUrl.origin !== base.origin) {
      failed = true;
      console.log('  RESULT: ASSET ON DIFFERENT ORIGIN; cannot safely inspect.');
      continue;
    }
    const served = await fetch(assetUrl, {signal: AbortSignal.timeout(15000)});
    if (!served.ok) {
      failed = true;
      console.log('  RESULT: asset request HTTP '+served.status);
      continue;
    }
    const localBytes = await readFile(resolve(repoRoot, result.path));
    const servedBytes = Buffer.from(await served.arrayBuffer());
    const match = sha256(localBytes) === sha256(servedBytes);
    console.log('  byte parity:    '+(match ? 'MATCH' : 'MISMATCH'));
    if (!match) failed = true;
  }

  if (failed) {
    console.error('\nParity NOT confirmed: do not sign off the live appearance from this check.');
    process.exitCode = 1;
  } else {
    console.log('\nPublic assets MATCH the checked local checkout. This does NOT verify hospital browser cache or authenticated UX.');
  }
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) checkLive(process.argv[2]).catch(error => {
  console.error('Parity check unavailable: '+error.message);
  console.error('From the hospital browser: disable cache in DevTools, reload, then verify both ?v= asset URLs and their responses.');
  process.exitCode = 2;
});
