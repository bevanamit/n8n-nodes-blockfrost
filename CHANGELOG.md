# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-12-17
### Added
- Major stable release: production-ready `n8n` community node for Blockfrost API
- Support for 75+ Blockfrost endpoints: blocks, epochs, transactions, pools, governance, mempool, metadata, and more
- TypeScript sources compiled to `dist/` and included SVG assets for node and credentials
- Build scripts (`npm run build`) and lint/test scripts added

### Fixed
- Resolved CommonJS/ESModule export issues preventing n8n from loading node
- Corrected package `n8n` section and `files` entries to ensure proper packaging

### Notes
- This release targets n8n v1.x compatibility; verify your n8n runtime if community nodes are not recognized.

