const persistence = require('./persistence');

const buildScripts = () => {
  const srcDir = persistence.getDir('src.scripts');
  persistence.copyFolder(srcDir, 'scripts');
};

module.exports = { build: buildScripts };
