const fs = require('fs');
const ncp = require('ncp').ncp;
const rimraf = require('rimraf');
const yaml = require('js-yaml');

const dirs = { src: {}, out: {} };


const prepDirs = (config) => {
  const src = Object.keys(config.dirs).reduce((acc, key) => {
    acc[key] = `${config.args.src}/${config.dirs[key]}`;
    return acc;
  }, {});
  src.root = config.args.src;

  const out = { root: config.args.out };

  if (fs.existsSync(out.root)) rimraf.sync(out.root);
  fs.mkdirSync(out.root);

  dirs.src = src;
  dirs.out = out;

  return { src, out };
};

const getDir = (path) => {
  const parts = path.split('.');
  let dir = null;

  if (parts.length === 2) dir = dirs[parts[0]][parts[1]];
  else if (parts.lenth === 1) dir = dirs[path];
  else console.error(`Dir not specified (${path}).`);

  return dir;
};

const getSrc = path => getDir(`src.${path}`);

const copyFolder = (src, dest) => {
  ncp.limit = 16;

  ncp(src, `${dirs.out.root}/${dest}`, (err) => {
    if (err) return console.error(err);
    return true;
  });
};

const copySimply = name => copyFolder(getSrc(name), name);

const loadFolder = path => fs.readdirSync(path).map(filename => ({
  filename,
  name: filename.split('.')[0],
  ext: filename.split('.').splice(1, 1).join('.'),
  meta: {},
  path,
  content: fs.readFileSync(`${path}/${filename}`, 'utf8'),
}));

const saveFolder = path => files =>
  files.map(file => fs.writeFile(`${path}/${file.filename}`, file.content, (err) => { if (err) throw err; }));


// special loaders
const loadConfig = args => Object
  .assign({}, yaml.safeLoad(fs.readFileSync(`${args.src}/config.yaml`, 'utf8')), { args });

const loadContent = (dir) => {
  const files = loadFolder(dir);

  return {
    index: files.filter(file => file.name.match('index'))[0],
    chapters: files.filter(file => file.name.match('^[0-9]+-')),
    notes: files.filter(file => file.name.match('notes'))[0],
    license: files.filter(file => file.name.match('license'))[0],
  };
};

const loadDictionary = () => {
  let result = null;

  try {
    result = yaml.safeLoad(fs.readFileSync(`${getDir('src.dictionary')}/terms.yaml`, 'utf8'));
  } catch (e) {
    console.log(e);
  }

  return result;
};


// special savers
const saveBibliography = (html, json) => {
  fs.writeFile(`${getDir('out.root')}/bib.html`, html, (err) => { if (err) throw err; });
  fs.writeFile(`${getDir('out.root')}/bib.json`, json, (err) => { if (err) throw err; });
};

const saveMeta = data => fs
  .writeFile(`${dirs.out.root}/meta.json`, JSON.stringify(data), (err) => { if (err) throw err; });

const saveStyle = (sassConfig, result) => {
  fs.mkdirSync(`${getDir('out.root')}/style`);

  fs.writeFile(sassConfig.outFile, result.css.toString(), (err2) => {
    if (err2) throw err2;
  });

  fs.writeFile(`${sassConfig.outFile}.map`, result.map.toString(), (err2) => {
    if (err2) throw err2;
  });
};

const saveContents = (contents) => {
  saveFolder(getDir('out.root'))(contents);
};

const saveDictionary = (html) => {
  fs.writeFile(`${getDir('out.root')}/dictionary.html`, html, (err) => { if (err) throw err; });
};

module.exports = {
  prepDirs,
  getDir,
  getSrc,

  loadFolder,

  saveFolder,
  copyFolder,
  copySimply,

  loadConfig,
  loadContent,
  loadDictionary,

  saveBibliography,
  saveMeta,
  saveStyle,
  saveContents,
  saveDictionary,
};
