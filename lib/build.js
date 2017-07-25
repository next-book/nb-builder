const persistence = require('./persistence');
const revision = require('./revision');
const content = require('./content');
const templating = require('./templating');
const dictionary = require('./dictionary');
const sources = require('./sources');
const style = require('./style');
const scripts = require('./scripts');

const buildMeta = (config) => {
  const meta = Object.assign(
    {},
    config.about,
    { args: config.args },
    { revision: revision.build(config.args.src) });

  persistence.saveMeta({ config, meta });

  return meta;
};

const build = (args) => {
  const config = persistence.loadConfig(args);
  persistence.prepDirs(config);

  // build meta
  const meta = buildMeta(config);

  // build style
  style.build();

  // build scripts
  scripts.build();

  // copy assets
  persistence.copySimply('assets');

  // get templates
  const templates = templating.build(meta);

  // load bibliography
  const bibItems = sources.build(config.lang, config.citationStyle, templates);

  // dictionary
  const dictionaryTerms = dictionary.init();

  // build pages
  const contents = content.build(meta, templates, bibItems, dictionaryTerms);

  // build dictionary
  dictionary.build(dictionaryTerms, meta, contents, templates);
};


module.exports = build;
