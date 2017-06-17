const fs = require('fs');
const persistence = require('./persistence');

const buildScripts = (srcDir, outDir) => {
  const files = persistence.loadFolder(srcDir);
  fs.mkdirSync(`${outDir}`);
  persistence.saveFolder(`${outDir}`)(files);
};

module.exports = { build: buildScripts };
