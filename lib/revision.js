const cp = require('child_process');
const fs = require('fs');

const getRevision = (srcDir) => cp.execSync(`cd ${srcDir} && git rev-parse HEAD`, { encoding: 'utf8' }).trim();

module.exports = { getRevision };
