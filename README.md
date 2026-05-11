# svg-tidy

[![npm version](https://img.shields.io/npm/v/@marcovega/svg-tidy.svg)](https://www.npmjs.com/package/@marcovega/svg-tidy)

A tiny CLI that optimizes every `.svg` file in a directory using
[SVGO](https://github.com/svg/svgo) with the same plugin settings as the
[SVGOMG](https://svgomg.net/) preset.

On the **first** run inside a directory it writes a `.svgtidy.json` file with
the default plugin settings. On subsequent runs it reads that file. Commit it
to your repo so everyone on the team optimizes icons the same way.

It rewrites each `.svg` file **in place**, so the result is ready to drop into
your assets folder.

## Quick start

No install needed — just run it with `npx`:

```bash
cd path/to/your/svgs
npx @marcovega/svg-tidy
```

Or install globally (the binary is `svg-tidy`):

```bash
npm install -g @marcovega/svg-tidy
svg-tidy
```

## Usage

```text
svg-tidy [paths...] [options]

Arguments:
  paths              Files or directories to process. Defaults to the current
                     working directory.

Options:
  -r, --recursive    Recurse into subdirectories when a directory is given.
  -n, --dry-run      Show what would change without writing files.
  -q, --quiet        Only print the final summary.
      --init         Write a default .svgtidy.json (if missing) and exit.
      --config PATH  Use a specific config file. Defaults to ./.svgtidy.json.
  -h, --help         Show this help.
```

Examples:

```bash
npx @marcovega/svg-tidy                  # optimize every .svg in this dir
npx @marcovega/svg-tidy -r                # ...recursively
npx @marcovega/svg-tidy ./icons logo.svg  # specific paths
npx @marcovega/svg-tidy -n                # preview savings, don't write
npx @marcovega/svg-tidy --init            # just create .svgtidy.json and stop
```

Each file is overwritten only when SVGO actually changes its contents.

## The `.svgtidy.json` config file

The first time you run `svg-tidy` in a directory it creates
`.svgtidy.json` next to your icons. The file uses the SVGOMG-style boolean
plugin map:

```json
{
  "multipass": true,
  "js2svg": { "indent": 2, "pretty": false },
  "plugins": {
    "cleanupAttrs": true,
    "cleanupIDs": true,
    "cleanupListOfValues": false,
    "removeViewBox": false,
    "removeXMLNS": false,
    "removeScriptElement": false,
    "removeStyleElement": false
  }
}
```

To customize: edit the file, set a plugin to `false` to disable it, or pass
custom plugin params with an object value:

```json
{
  "plugins": {
    "removeDesc": { "removeAny": true },
    "cleanupIds": { "minify": false }
  }
}
```

Commit `.svgtidy.json` to your repo so collaborators (and CI) get the same
optimizations every time someone runs `svg-tidy`.

### Notes on renamed SVGO plugins

SVGO renamed a couple plugins between the SVGOMG UI and modern SVGO. Both
old and new names are accepted in `.svgtidy.json`:

| SVGOMG name           | SVGO v4 name      |
| --------------------- | ----------------- |
| `cleanupIDs`          | `cleanupIds`      |
| `removeScriptElement` | `removeScripts`   |

## How `npx` finds this package

`npx some-package` does one of three things, in order:

1. Runs `some-package` from the current project's `node_modules/.bin/`.
2. Runs it from your global `PATH`.
3. Downloads it from the npm registry to a temp cache and runs it.

Because `@marcovega/svg-tidy` is published to npm, option 3 just works — no
`npm link` required for end users.

## Local development

```bash
git clone git@github.com:marcovega/svg-tidy.git
cd svg-tidy
npm install
npm link            # makes `svg-tidy` available globally for testing
```

To remove the global symlink later: `npm unlink -g @marcovega/svg-tidy`.

## Updating SVGO

```bash
npm install svgo@latest
```

## License

[MIT](./LICENSE)
