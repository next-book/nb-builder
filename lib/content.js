const jsdom = require('jsdom');
const fm = require('front-matter');
const md = require('markdown-it')()
  .use(require('markdown-it-footnote'));

const { appendMeta, appendLink } = require('./domHelpers');

const dictionary = require('./dictionary');
const mapper = require('./mapper');
const revision = require('./revision');
const persistence = require('./persistence');
const bibliography = require('./bibliography');

const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);


const extractFrontMatter = files => files.map((file) => {
  const extractedContent = fm(file.content);
  file.meta = Object.assign({}, file.meta, extractedContent.attributes);
  file.content = extractedContent.body;
  return file;
});


const removeHtmlComments = text => text.replace(/<!--.+?-->/g, '');

const renderMarkdown = text => md.render(text);

const renderContent = content => ([
  removeHtmlComments,
  renderMarkdown,
].reduce(
  (acc, fn) => fn(acc), content));


const addNavigation = files => files.map((file, index) => {
  file.meta.prev = files[index - 1] ? files[index - 1].name : 'index';
  file.meta.next = files[index + 1] ? files[index + 1].name : 'index';
  return file;
});


const appendNotes = notes => files => files.map((file) => {
  file.content += notes.content;
  return file;
});

const buildChapter = templates => files => files.map(file => ({
  name: file.name,
  ext: 'html',
  filename: `${file.name}.html`,
  meta: Object.assign({}, file.meta, {
    section: file.name,
    sectionNumber: parseInt(file.name, 10),
  }),
  content: templates(
    { content: renderContent(file.content), meta: file.meta },
    file.meta.template ? file.meta.template : 'default'),
}));

const buildMeta = (config) => {
  const meta = Object.assign(
    {},
    config.about,
    { args: config.args },
    { revision: revision.build(config.args.src) });

  persistence.saveMeta({ config, meta });

  return meta;
};

const addMetadata = (publication, chapterData) => (dom) => {
  appendMeta(dom, 'publication', publication.title);
  appendMeta(dom, 'revision', publication.revision.hash);
  appendMeta(dom, 'revisionDate', publication.revision.date);
  appendLink(dom, 'license', './license.html');

  const defaults = {
    section: '',
    sectionNumber: '',
    prev: 'index',
    next: 'index',
    index: 'index',
  };

  const chapter = Object.assign({}, defaults, chapterData);

  appendMeta(dom, 'section', chapter.section);
  appendMeta(dom, 'sectionNumber', chapter.sectionNumber);
  appendLink(dom, 'prev', `./${chapter.prev}.html`);
  appendLink(dom, 'next', `./${chapter.next}.html`);
  appendLink(dom, 'index', './index.html');
};

const garnishWrapper = garnishFn => files => files.map((file) => {
  file.content = garnishFn(file.content, file.meta);
  return file;
});

const garnish = (publicationMetadata, bibItems, dictionaryTerms) => (content, meta) => {
  const dom = new jsdom.JSDOM(content);

  mapper.build(dom);
  dictionary.domLinkTerms(dictionaryTerms)(dom);
  bibliography.domEnhanceBibLinks(bibItems)(dom);
  addMetadata(publicationMetadata, meta)(dom);
  // typo.domAddNbsp(dom);

  return dom.serialize();
};

const buildContent = (content, templates, garnishFn) => pipe(
  extractFrontMatter,
  addNavigation,
  appendNotes(content.notes),
  buildChapter(templates),
  garnishWrapper(garnishFn),
  mapper.addCounts)([content.license, content.index, ...content.chapters]);

const build = (templates, garnishFn) => {
  const source = persistence.loadContent(persistence.getDir('src.text'));
  const contents = buildContent(source, templates, garnishFn);
  persistence.saveContents(contents);

  return contents;
};

module.exports = { build, buildMeta, garnish };
