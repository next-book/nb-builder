const sass = require('node-sass');
const fs = require('fs');

const buildStyle = (srcDir, outDir) => {
  const sassConfig = {
    file: `${srcDir}/style.scss`,
    outFile: `${outDir}/style.css`,
    sourceMap: true,
  };

  sass.render(sassConfig, (err, result) => {
    if (err) throw err;

    fs.mkdirSync(`${outDir}`);

    fs.writeFile(sassConfig.outFile, result.css.toString(), (err2) => {
      if (err2) throw err2;
    });

    fs.writeFile(`${sassConfig.outFile}.map`, result.map.toString(), (err2) => {
      if (err2) throw err2;
    });
  });
};

module.exports = { build: buildStyle };
