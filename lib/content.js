const jsdom = require('jsdom');
const fm = require('front-matter');
const md = require('markdown-it')()
  .use(require('markdown-it-footnote'));

const ideas = require('./ideas');

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

const addMeta = meta => files => files.map((file) => {
  file.meta = Object.assign({}, meta, file.meta);
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
  meta: file.meta,
  content: templates[file.meta.template ? file.meta.template : 'default']
    ({ content: renderContent(file.content), meta: Object.assign({}, file.meta, {section: file.name})}),
}));


const domEnhanceLinks = (bibItemsJson, bibItemsHtml) => (dom) => {
  const links = dom.window.document.querySelectorAll('a');
  const bibItemsHtmlObj = bibItemsHtml.reduce((acc, item) => {
    acc[item.id] = item.content;
    return acc;
  }, {});

  Array.prototype.map.call(links, (link) => {
    const href = link.getAttribute('href');

    if (href.match(/^bib\//)) {
      const key = /bib\/(.+)/.exec(href)[1];

      if (!bibItemsJson[key]) {
        console.error(`Bibliography item "${key}" not found!`);
      } else {
        const bibHtmlEl = dom.window.document.createElement('div');
        bibHtmlEl.innerHTML = bibItemsHtmlObj[key];

        const bibRecord = bibHtmlEl.querySelector('.csl-right-inline').innerHTML;
        const title = link.getAttribute('title');

        link.setAttribute('href', `${href}.html`);
        link.setAttribute('data-bib-key', key);
        link.setAttribute('data-bib-html', JSON.stringify({ record: `<p>${bibRecord}</p>` }));
        link.setAttribute('rel', 'source');
        link.setAttribute('title', `${bibRecord.replace(/(<([^>]+)>)/ig, '')}${title ? ', ' : ''}${title}`);

        link.classList.add('bibliography');
        link.classList.add(`bib-${bibItemsJson[key].type}`);
      }
    }
  });
};

const getDocRefNumber = filename => (filename.match(/^\d+/) ? parseInt(filename.match(/^\d+/)[0], 10) : 0);

const domAddDocRefNumber = file => (dom) => {
  const body = dom.window.document.querySelector('body');
  body.setAttribute('data-nb-ref-number', getDocRefNumber(file.name));
};


const domAddElsRefNumbers = (dom) => {
  const els = dom.window.document.querySelectorAll('p, ul, h1, h2, h3, h4, h5, h6, blockquote, dl, table');

  let i = 1;
  Array.prototype.map.call(els, (el) => {
    el.classList.add('chunk');
    el.setAttribute('data-nb-ref-number', i);
    i += 1;
  });
};

const replaceChildText = (node, findText, replaceText) => {
  if (node.nodeType === 3) {
    node.textContent = node.textContent.replace(findText, replaceText);
  } else {
    Array.prototype.slice.call(node.childNodes)
      .map(childNode => replaceChildText(childNode, findText, replaceText));
  }
};

const addNbsp = text => text
    .split(' ')
    .map(part => part.trim().length === 0 
      ? part 
      : part.trim().length <= 2 
        ? `${part}\u00A0` 
        : `${part} `)
    .join('');

const domAddNbsp = (dom) => {
  const body = dom.window.document.querySelector('body');
  
  applyToTextNodes(body)(addNbsp);
  // with ES6 unicode char classes it's possible to use
  // replaceChildText(body, /(\b[\w]{1,2}) /gu, '$1\u00A0');
};

const applyToTextNodes = node => (fn) => {
  if (node.nodeType === 3) {
    node.textContent = fn(node.textContent);
  } else {
    Array.prototype.slice.call(node.childNodes).map(childNode => applyToTextNodes(childNode, fn));
  }
};

const domEdits = (bibItemsJson, bibItemsHtml) => files => files.map((file) => {
  const dom = new jsdom.JSDOM(file.content);

  domAddDocRefNumber(file)(dom);
  domAddElsRefNumbers(dom);
  ideas.build(dom);
  domAddNbsp(dom);
  domEnhanceLinks(bibItemsJson, bibItemsHtml)(dom);

  file.content = dom.serialize();
  return file;
});

const addCounts = files => {
  const totals = { chars: 0, words: 0 };
  
  const doms = files
    .map((file) => {
      const dom = new jsdom.JSDOM(file.content);
      const body = dom.window.document.querySelector('body');
      if (file.meta.stats == 'exclude') {
        body.setAttribute('excluded-from-stats', 'true');
      } else {
        const chars = parseInt(body.getAttribute('data-nb-chars'));
        const words = parseInt(body.getAttribute('data-nb-words'));
        body.setAttribute('data-nb-chars-before', totals.chars);
        body.setAttribute('data-nb-words-before', totals.words);
        totals.chars += chars;
        totals.words += words;  
      }
      return dom;
    });
  
  return doms.map((dom, index) => {
    const body = dom.window.document.querySelector('body');
    body.setAttribute('data-nb-chars-total', totals.chars);
    body.setAttribute('data-nb-words-total', totals.words);
    
    files[index].content = dom.serialize();
    return files[index];
  });
}


const build = (content, templates, meta, bibItemsJson, bibItemsHtml) => pipe(
  addMeta(meta),
  extractFrontMatter,
  addNavigation,
  appendNotes(content.notes),
  buildChapter(templates),
  domEdits(bibItemsJson, bibItemsHtml),
  addCounts)([content.license, content.index, ...content.chapters]);

module.exports = { build };
