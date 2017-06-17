const fs = require('fs');
const ncp = require('ncp').ncp;
const rimraf = require('rimraf');

const dirs = { src: {}, out: {} };

const prepDirs = (srcDir, outDir, confDirs) => {
  const src = Object.keys(confDirs).reduce((acc, key) => {
    acc[key] = `${srcDir}/${confDirs[key]}`;
    return acc;
  }, {});
  src.root = srcDir;

  const out = { root: outDir };

  if (fs.existsSync(out.root)) rimraf.sync(out.root);
  fs.mkdirSync(out.root);

  dirs.src = src;
  dirs.out = out;

  return { src, out };
};

const copyFolder = src => (dest) => {
  ncp.limit = 16;

  ncp(src, `${dirs.out.root}/${dest}`, (err) => {
    if (err) return console.error(err);
    return true;
  });
};

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


const loadContent = (dir) => {
  const files = loadFolder(dir);

  return {
    index: files.filter(file => file.name.match('index'))[0],
    chapters: files.filter(file => file.name.match('^[0-9]+-')),
    notes: files.filter(file => file.name.match('notes'))[0],
    license: files.filter(file => file.name.match('license'))[0],
  };
};

const saveBibliography = (html, json) => {
  const dir = `${dirs.out.root}/bib`;

  fs.mkdirSync(dir);

  html.reduce((acc, file) => fs.writeFile(`${dir}/${file.id}.html`, file.content, (err) => { if (err) throw err; }), 0);

  fs.writeFile(`${dir}/bib.json`, JSON.stringify(json), (err) => { if (err) throw err; });
};

module.exports = { prepDirs, loadFolder, saveFolder, copyFolder, loadContent, saveBibliography };
