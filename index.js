const fs = require('fs');

const yaml = require('js-yaml');
const dot = require('dot');

const persistence = require('./lib/persistence');
const revision = require('./lib/revision');
const content = require('./lib/content');
const navigation = require('./lib/navigation');
const style = require('./lib/style');
const scripts = require('./lib/scripts');

const build = (args) => {
  const config = getConfig(args.src);
  const dirs = persistence.prepDirs(args.src, args.out, config.dirs);
  const meta = Object.assign({}, args, { publication: config.about }, revision.build(dirs.src.root));

  // build style
  style.build(dirs.src.style, `${dirs.out.root}/style`);

  // build scripts
  scripts.build(dirs.src.scripts, `${dirs.out.root}/scripts`);
  
  // copy assets
  persistence.copyFolder(dirs.src.assets)('assets');

  // load bibliography
  const bibItems = navigation.load(dirs.src.bibliography, dirs.out.root);
  persistence.saveBibliography(navigation.buildHtml(bibItems), navigation.buildJson(bibItems));
  
  const indexItems = navigation.loadIndex(dirs.src.bibliography);

  // build pages
  const templates = dot.process({ path: dirs.src.templates });
  const contentSource = persistence.loadContent(dirs.src.text);
  const contents = content.build(contentSource, templates, meta, navigation.buildJson(bibItems), navigation.buildHtml(bibItems), indexItems);
  persistence.saveFolder(dirs.out.root)(contents);
  
  const defList = content.buildDefinitionsList(indexItems, contentSource.chapters, templates);
  persistence.saveFolder(dirs.out.root)(defList);
  

  writeMeta(`${args.out}/meta.json`)({ config, meta, args });

  // write license
};

const getConfig = srcDir => yaml.safeLoad(fs.readFileSync(`${srcDir}/config.yaml`, 'utf8'));

const writeMeta = path => contents => fs.writeFile(path, JSON.stringify(contents), (err) => {
  if (err) throw err;
});


module.exports = build;
