const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Project root is artifacts/mobile; workspace root is two levels up
const workspaceRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(__dirname);

// Include workspace-level node_modules so Metro can resolve pnpm-hoisted packages
config.watchFolders = [workspaceRoot];

// Resolve modules from workspace root first, then project root
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(__dirname, "node_modules"),
];

// Block Metro from watching temp dirs that appear/disappear (Vite, AWS SDK, etc.)
// This prevents ENOENT crashes when build tools create and destroy temp dirs
const { blockList: existingBlockList } = config.resolver;
const TEMP_PATTERNS = [
  /[/\\]\.vite[/\\]/,
  /@aws-sdk[^/\\]*[/\\][^/\\]*_tmp_\d+/,
];

if (existingBlockList) {
  const existing = Array.isArray(existingBlockList) ? existingBlockList : [existingBlockList];
  config.resolver.blockList = [...TEMP_PATTERNS, ...existing];
} else {
  config.resolver.blockList = TEMP_PATTERNS;
}

module.exports = config;
