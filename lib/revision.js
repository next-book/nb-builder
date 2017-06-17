const cp = require('child_process');

const getRevision = srcDir => cp.execSync(`cd ${srcDir} && git rev-parse HEAD`, { encoding: 'utf8' }).trim();
const getDate = srcDir => cp.execSync(`cd ${srcDir} && git log -1 --format=%cd | cat`, { encoding: 'utf8' }).trim();

const build = srcDir => ({
  bookRevision: getRevision(srcDir),
  bookDate: new Date(getDate(srcDir)).toISOString(),
  builderRevision: getRevision('.'),
  builderDate: new Date(getDate('.')).toISOString(),
  compiledDate: new Date().toISOString(),
});

module.exports = { build };
