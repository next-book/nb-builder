const jsdom = require('jsdom');
const fm = require('front-matter');
const md = require('markdown-it')()
  .use(require('markdown-it-footnote'));

const { appendMeta, appendLink } = require('./domHelpers');

const dictionary = require('./dictionary');
const mapper = require('./mapper');
const persistence = require('./persistence');
const sources = require('./sources');

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
  file.meta.license = 'license';
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

const addMetadata = (publication, chapter) => (dom) => {
  appendMeta(dom, 'publication', publication.title);
  appendMeta(dom, 'revision', publication.revision.hash);
  appendMeta(dom, 'revisionDate', publication.revision.date);

  appendMeta(dom, 'section', chapter.section);
  appendMeta(dom, 'sectionNumber', chapter.sectionNumber);

  appendLink(dom, 'prev', `./${chapter.prev}.html`);
  appendLink(dom, 'next', `./${chapter.next}.html`);
  appendLink(dom, 'license', `./${chapter.license}.html`);
  appendLink(dom, 'index', './index.html');
};

const domEdits = (metadata, bibItems, dictionaryItems) => files => files.map((file) => {
  const dom = new jsdom.JSDOM(file.content);

  mapper.build(dom);
  dictionary.domLinkTerms(dictionaryItems)(dom);
  sources.domEnhanceBibLinks(bibItems)(dom);
  addMetadata(metadata, file.meta)(dom);
  // typo.domAddNbsp(dom);

  file.content = dom.serialize();
  return file;
});

const buildContent = (content, metadata, templates, bibItems, dictionaryItems) => pipe(
  extractFrontMatter,
  addNavigation,
  appendNotes(content.notes),
  buildChapter(templates),
  domEdits(metadata, bibItems, dictionaryItems),
  mapper.addCounts)([content.license, content.index, ...content.chapters]);

const build = (metadata, templates, bibItems, dictionaryItems) => {
  const contents = buildContent(
    persistence.loadContent(persistence.getDir('src.text')),
    metadata, templates, bibItems, dictionaryItems);

  persistence.saveContents(contents);

  return contents;
};

module.exports = { build };
