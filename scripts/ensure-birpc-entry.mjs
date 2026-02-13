import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const birpcDir = path.join(projectRoot, 'node_modules', 'birpc');
const birpcEntry = path.join(birpcDir, 'index.js');
const birpcCjs = path.join(birpcDir, 'dist', 'index.cjs');

if (!fs.existsSync(birpcDir)) {
  process.exit(0);
}

if (fs.existsSync(birpcEntry)) {
  process.exit(0);
}

if (!fs.existsSync(birpcCjs)) {
  process.exit(0);
}

fs.writeFileSync(
  birpcEntry,
  "'use strict';\nmodule.exports = require('./dist/index.cjs');\n",
  'utf8'
);
