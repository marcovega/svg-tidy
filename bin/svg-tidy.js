#!/usr/bin/env node
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import path from 'node:path';
import process from 'node:process';
import { optimize } from 'svgo';
import {
  CONFIG_FILENAME,
  loadOrCreateConfig,
  resolveConfigPath,
  toSvgoOptions,
} from '../lib/config.js';

// `npx` / `npm exec` chdir into the nearest enclosing project root before
// invoking the bin, which would make us scan the wrong directory. npm leaves
// the user's original working directory in INIT_CWD, so restore it.
if (process.env.INIT_CWD && process.env.INIT_CWD !== process.cwd()) {
  try {
    process.chdir(process.env.INIT_CWD);
  } catch {
    // INIT_CWD is unreachable; fall through with whatever cwd we have.
  }
}

const HELP = `svg-tidy - optimize SVG files in place using SVGO

Usage:
  svg-tidy [paths...] [options]

Arguments:
  paths              Files or directories to process. Defaults to the current
                     working directory.

Options:
  -r, --recursive    Recurse into subdirectories when a directory is given.
  -n, --dry-run      Show what would change without writing files.
  -q, --quiet        Only print the final summary.
      --init         Write a default ${CONFIG_FILENAME} (if missing) and exit.
      --config PATH  Use a specific config file. Defaults to ./${CONFIG_FILENAME}.
  -h, --help         Show this help.

Config:
  On first run in a directory svg-tidy writes ${CONFIG_FILENAME} with the
  SVGOMG-style default plugin settings. Edit that file (or commit it) to
  customize how SVGs are optimized. Subsequent runs reuse it.

Examples:
  svg-tidy                       # optimize every .svg in this dir
  svg-tidy -r                    # ...recursively
  svg-tidy ./icons logo.svg      # specific paths
  svg-tidy -n                    # preview savings, don't write
  svg-tidy --init                # just create the default config and stop
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    recursive: { type: 'boolean', short: 'r', default: false },
    'dry-run': { type: 'boolean', short: 'n', default: false },
    quiet: { type: 'boolean', short: 'q', default: false },
    init: { type: 'boolean', default: false },
    config: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

const recursive = values.recursive;
const dryRun = values['dry-run'];
const quiet = values.quiet;
const initOnly = values.init;
const targets = positionals.length > 0 ? positionals : [process.cwd()];

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function pct(before, after) {
  if (before === 0) return '0.0%';
  return `${(((before - after) / before) * 100).toFixed(1)}%`;
}

async function collectSvgs(target) {
  const resolved = path.resolve(target);
  let entryStat;
  try {
    entryStat = await stat(resolved);
  } catch (err) {
    throw new Error(`Cannot access ${target}: ${err.message}`);
  }

  if (entryStat.isFile()) {
    return resolved.toLowerCase().endsWith('.svg') ? [resolved] : [];
  }

  if (!entryStat.isDirectory()) return [];

  const files = [];
  const entries = await readdir(resolved, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(resolved, entry.name);
    if (entry.isDirectory()) {
      if (recursive) files.push(...(await collectSvgs(full)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
      files.push(full);
    }
  }
  return files;
}

async function processFile(file, svgoOptions) {
  const original = await readFile(file, 'utf8');
  const result = optimize(original, { path: file, ...svgoOptions });

  if (result.error) throw new Error(result.error);

  const optimized = result.data;
  const beforeBytes = Buffer.byteLength(original, 'utf8');
  const afterBytes = Buffer.byteLength(optimized, 'utf8');
  const changed = optimized !== original;

  if (changed && !dryRun) {
    await writeFile(file, optimized, 'utf8');
  }

  return { file, beforeBytes, afterBytes, changed };
}

async function main() {
  const cwd = process.cwd();
  const configPath = resolveConfigPath(cwd, values.config);

  const { config, created } = await loadOrCreateConfig(configPath);
  const svgoOptions = toSvgoOptions(config);
  const relConfig = path.relative(cwd, configPath) || configPath;

  if (created) {
    console.log(`Wrote default config to ${relConfig}.`);
    console.log('Edit it to customize plugins, then re-run svg-tidy.');
  } else if (!quiet) {
    console.log(`Using config: ${relConfig}`);
  }

  if (initOnly) {
    if (!created) console.log(`${relConfig} already exists. No changes made.`);
    return;
  }

  const allFiles = new Set();
  for (const target of targets) {
    const found = await collectSvgs(target);
    for (const f of found) allFiles.add(f);
  }
  const files = [...allFiles].sort();

  if (files.length === 0) {
    console.error('No .svg files found.');
    process.exit(1);
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let changedCount = 0;
  let failedCount = 0;

  for (const file of files) {
    try {
      const r = await processFile(file, svgoOptions);
      totalBefore += r.beforeBytes;
      totalAfter += r.afterBytes;
      if (r.changed) changedCount += 1;
      if (!quiet) {
        const rel = path.relative(cwd, r.file) || r.file;
        const tag = r.changed
          ? `${formatBytes(r.beforeBytes)} -> ${formatBytes(r.afterBytes)} (${pct(r.beforeBytes, r.afterBytes)})`
          : 'no change';
        console.log(`${dryRun && r.changed ? '[dry] ' : ''}${rel}: ${tag}`);
      }
    } catch (err) {
      failedCount += 1;
      console.error(`FAILED ${file}: ${err.message}`);
    }
  }

  const verb = dryRun ? 'Would optimize' : 'Optimized';
  console.log(
    `\n${verb} ${changedCount}/${files.length} file(s). ` +
      `Total: ${formatBytes(totalBefore)} -> ${formatBytes(totalAfter)} ` +
      `(${pct(totalBefore, totalAfter)} smaller)` +
      (failedCount ? `. ${failedCount} failed.` : '.'),
  );

  if (failedCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
