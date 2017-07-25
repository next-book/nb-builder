const Citation = require('citation-js');
const fs = require('fs');
const persistence = require('./persistence');

const conf = {
  format: 'string',
  type: 'html',
};

const removeComments = text => text.replace(/(^|\n)\s*#.+?\n/g, '\n');

const extractItems = (text) => {
  const items = removeComments(text).split('\n@');

  return items.map((item) => {
    let citation = null;
    if (item.trim()) {
      citation = new Citation(`@${item.trim()}`);
    }
    return citation;
  }).filter(item => item);
};

const buildItems = items => items.reduce((acc, item) => {
  acc[item.get()[0].id] = {
    raw: item,
    json: item.get()[0],
    html: item.get(conf),
  };
  return acc;
}, {});

const build = (items, templates, garnishFn) => {
  const keys = Object.keys(items);
  // const sorted = keys.sort((a, b) => items[a].html.localeCompare(items[b].html));
  const content = keys.reduce((acc, key) => `${acc}<div id="${key}">${items[key].html}</div>`, '');

  const file = {
    content,
    meta: Object.assign({}, {
      title: 'Užitá literatura',
      name: 'bib',
    }),
  };

  const html = templates(file, 'default');
  const richHtml = garnishFn(html);

  persistence.saveBibliography(richHtml, JSON.stringify(items));
};

const init = (lang, style) => {
  conf.lang = lang || 'en-US';
  conf.style = `citation-${style}` || 'citation-apa';

  const dir = persistence.getDir('src.bibliography');
  const data = fs.readFileSync(`${dir}/sources.bib`, 'utf8');
  const citationTemplatePath = `${dir}/${style}.csl`;
  if (fs.existsSync(citationTemplatePath)) {
    conf.template = fs.readFileSync(citationTemplatePath, 'utf8');
  }
  const items = buildItems(extractItems(data));
  return items;
};


const domEnhanceBibLinks = bibItems => (dom) => {
  const links = dom.window.document.querySelectorAll('a');

  Array.prototype.map.call(links, (link) => {
    const href = link.getAttribute('href');

    if (href.match(/^bib\//)) {
      const key = /bib\/(.+)/.exec(href)[1];

      if (!bibItems[key]) {
        console.error(`Bibliography item "${key}" not found!`);
      } else {
        const bibRecord = bibItems[key].html;
        const title = link.getAttribute('title');

        link.setAttribute('href', `bib.html#${key}`);
        link.setAttribute('data-bib-key', key);
        link.setAttribute('data-bib-html', JSON.stringify({ record: `<p>${bibRecord}</p>` }));
        link.setAttribute('rel', 'source');
        link.setAttribute('title', `${bibRecord.replace(/(<([^>]+)>)/ig, '')}${title ? ', ' : ''}${title}`);

        link.classList.add('bibliography');
        link.classList.add(`bib-${bibItems[key].json.type}`);
      }
    }
  });
};

module.exports = { init, build, domEnhanceBibLinks };
