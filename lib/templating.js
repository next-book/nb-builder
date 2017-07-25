const dot = require('dot');
const persistence = require('./persistence');

const build = (publicationMetadata) => {
  const templates = dot.process({ path: persistence.getDir('src.templates') });

  return (data, template) => {
    const content = Object.assign({}, data, { publication: publicationMetadata });
    return templates[template](content);
  };
};

module.exports = { build };

