/**
 * Default SVGO plugin configuration for svg-tidy.
 *
 * `DEFAULT_CONFIG.plugins` is a SVGOMG-style boolean map (the same shape used
 * in the amazing-facts theme docs). Each key is a plugin name, the value is:
 *   - `true`               -> enable the plugin with its default params
 *   - `false`              -> disable it (omitted from SVGO's plugin list)
 *   - an `object` (params) -> enable with custom params
 *
 * The persisted `.svgtidy.json` file uses this exact shape so it's easy to
 * read, edit, and diff.
 *
 * SVGO renamed two plugins between the SVGOMG UI and modern SVGO; both old and
 * new names are accepted in the config file and normalized via PLUGIN_ALIASES.
 */

export const PLUGIN_ALIASES = {
  cleanupIDs: 'cleanupIds',
  removeScriptElement: 'removeScripts',
};

export const DEFAULT_CONFIG = {
  multipass: true,
  js2svg: {
    indent: 2,
    pretty: false,
  },
  plugins: {
    cleanupAttrs: true,
    cleanupEnableBackground: true,
    cleanupIDs: true,
    cleanupListOfValues: false,
    cleanupNumericValues: true,
    collapseGroups: true,
    convertColors: true,
    convertEllipseToCircle: true,
    convertPathData: true,
    convertShapeToPath: true,
    convertStyleToAttrs: true,
    convertTransform: true,
    inlineStyles: true,
    mergePaths: true,
    mergeStyles: true,
    minifyStyles: true,
    moveElemsAttrsToGroup: true,
    moveGroupAttrsToElems: true,
    removeComments: true,
    removeDesc: true,
    removeDimensions: true,
    removeDoctype: true,
    removeEditorsNSData: true,
    removeEmptyAttrs: true,
    removeEmptyContainers: true,
    removeEmptyText: true,
    removeHiddenElems: true,
    removeMetadata: true,
    removeNonInheritableGroupAttrs: true,
    removeRasterImages: true,
    removeScriptElement: false,
    removeStyleElement: false,
    removeTitle: true,
    removeUnknownsAndDefaults: true,
    removeUnusedNS: true,
    removeUselessDefs: true,
    removeUselessStrokeAndFill: true,
    removeViewBox: false,
    removeXMLNS: false,
    removeXMLProcInst: true,
    reusePaths: false,
    sortAttrs: false,
    sortDefsChildren: true,
  },
};
