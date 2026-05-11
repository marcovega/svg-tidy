import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CONFIG, PLUGIN_ALIASES } from './svgo-config.js';

export const CONFIG_FILENAME = '.svgtidy.json';

/**
 * Resolve where the config file lives.
 *
 * - If `configPath` is provided, use it verbatim.
 * - Otherwise look in `cwd` for `.svgtidy.json`.
 */
export function resolveConfigPath(cwd, configPath) {
  if (configPath) return path.resolve(cwd, configPath);
  return path.join(cwd, CONFIG_FILENAME);
}

/**
 * Load `.svgtidy.json` from disk. If it doesn't exist, write the default config
 * to that path first.
 *
 * Returns `{ config, path, created }`.
 */
export async function loadOrCreateConfig(configPath) {
  let raw;
  let created = false;
  try {
    raw = await readFile(configPath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    raw = JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n';
    await writeFile(configPath, raw, 'utf8');
    created = true;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${configPath}: ${err.message}`);
  }

  return { config: parsed, path: configPath, created };
}

/**
 * Convert a svg-tidy config (with a boolean/params plugin map) into the
 * options object expected by SVGO's `optimize()` function.
 */
export function toSvgoOptions(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object.');
  }

  const { multipass, js2svg, plugins: pluginMap } = config;

  if (pluginMap && typeof pluginMap !== 'object') {
    throw new Error('Config "plugins" must be an object map of name -> bool|params.');
  }

  const seen = new Set();
  const plugins = [];

  for (const [rawName, value] of Object.entries(pluginMap || {})) {
    if (value === false || value == null) continue;

    const name = PLUGIN_ALIASES[rawName] || rawName;
    if (seen.has(name)) continue;
    seen.add(name);

    if (value === true) {
      plugins.push(name);
    } else if (typeof value === 'object') {
      plugins.push({ name, params: value });
    } else {
      throw new Error(
        `Config plugin "${rawName}" must be a boolean or an object, got ${typeof value}.`,
      );
    }
  }

  return {
    multipass: Boolean(multipass),
    js2svg: js2svg || undefined,
    plugins,
  };
}
