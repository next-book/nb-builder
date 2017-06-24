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
  const meta = Object.assign({}, { publication: config.about }, revision.build(dirs.src.root));

  // build style
  style.build(dirs.src.style, `${dirs.out.root}/style`);

  // build scripts
  scripts.build(dirs.src.scripts, `${dirs.out.root}/scripts`);
  
  // copy assets
  persistence.copyFolder(dirs.src.assets)('assets');

  // load bibliography
  const bibItems = navigation.load(dirs.src.bibliography, dirs.out.root);
  persistence.saveBibliography(navigation.buildHtml(bibItems), navigation.buildJson(bibItems));

  // build pages
  const contents = persistence.loadContent(dirs.src.text);
  const templates = dot.process({ path: dirs.src.templates });
  persistence.saveFolder(dirs.out.root)(content.build(contents, templates, meta, navigation.buildJson(bibItems), navigation.buildHtml(bibItems)));

  writeMeta(`${args.out}/meta.json`)({ config, meta, args });

  // write license
};

const getConfig = srcDir => yaml.safeLoad(fs.readFileSync(`${srcDir}/config.yaml`, 'utf8'));

const writeMeta = path => contents => fs.writeFile(path, JSON.stringify(contents), (err) => {
  if (err) throw err;
});


module.exports = build;
