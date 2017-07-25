const persistence = require('./persistence');
const revision = require('./revision');
const content = require('./content');
const templating = require('./templating');
const dictionary = require('./dictionary');
const bibliography = require('./bibliography');
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

  const meta = buildMeta(config);
  const templates = templating.build(meta);
  const bibItems = bibliography.init(config.lang, config.citationStyle, templates);
  const dictionaryTerms = dictionary.init();

  const garnish = content.garnish(meta, bibItems, dictionaryTerms);
  const contents = content.build(templates, garnish);
  bibliography.build(bibItems, templates, garnish);
  dictionary.build(dictionaryTerms, meta, contents, templates, garnish);

  style.build();
  scripts.build();
  persistence.copySimply('assets');
};


module.exports = build;
