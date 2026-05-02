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

// Block Metro from watching Vite temp dirs that appear/disappear during hot reload
// This prevents ENOENT crashes when Vite creates and destroys temp dependency dirs
const { blockList: existingBlockList } = config.resolver;
const VITE_TEMP_RE = /[/\\]\.vite[/\\]/;

if (existingBlockList) {
  const existing = Array.isArray(existingBlockList) ? existingBlockList : [existingBlockList];
  config.resolver.blockList = [VITE_TEMP_RE, ...existing];
} else {
  config.resolver.blockList = VITE_TEMP_RE;
}

module.exports = config;
