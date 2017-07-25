const sass = require('node-sass');
const persistence = require('./persistence');

const buildStyle = () => {
  const config = {
    file: `${persistence.getDir('src.style')}/style.scss`,
    outFile: `${persistence.getDir('out.root')}/style/style.css`,
    sourceMap: true,
  };

  sass.render(config, (err, result) => {
    if (err) throw err;

    persistence.saveStyle(config, result);
  });
};

module.exports = { build: buildStyle };
