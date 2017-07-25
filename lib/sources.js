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
  });
};

const buildHtml = items => items.map(item => ({ id: item.get()[0].id, content: item.get(conf) }));

const buildJson = items => items.reduce((acc, item) => {
  acc[item.get()[0].id] = item.get()[0];
  return acc;
}, {});

const buildHtmlPage = (items, tpl) => {
  const content = items.reduce((acc, item) => acc + item.content, '');

  const file = {
    content,
    meta: Object.assign({}, {
      title: 'Užitá literatura',
      name: 'bib',
    }),
  };

  return tpl(file, 'default');
};

const build = (lang, style, template) => {
  conf.lang = lang || 'en-US';
  conf.style = `citation-${style}` || 'citation-apa';

  const dir = persistence.getDir('src.bibliography');
  const data = [fs.readFileSync(`${dir}/sources.bib`, 'utf8')];

  const citationTemplatePath = `${dir}/${style}.csl`;
  if (fs.existsSync(citationTemplatePath)) {
    conf.template = fs.readFileSync(citationTemplatePath, 'utf8');
  }

  const raw = data.reduce((acc, text) => extractItems(text), []).filter(item => item);
  const html = buildHtml(raw);
  const json = buildJson(raw);

  persistence.saveBibliography(buildHtmlPage(html, template), JSON.stringify(json));

  return { raw, html, json };
};


const domEnhanceBibLinks = bibItems => (dom) => {
  const links = dom.window.document.querySelectorAll('a');
  const bibItemsHtmlObj = bibItems.html.reduce((acc, item) => {
    acc[item.id] = item.content;
    return acc;
  }, {});

  Array.prototype.map.call(links, (link) => {
    const href = link.getAttribute('href');

    if (href.match(/^bib\//)) {
      const key = /bib\/(.+)/.exec(href)[1];

      if (!bibItems.json[key]) {
        console.error(`Bibliography item "${key}" not found!`);
      } else {
        const bibRecord = bibItemsHtmlObj[key];
        const title = link.getAttribute('title');

        link.setAttribute('href', `${href}.html`);
        link.setAttribute('data-bib-key', key);
        link.setAttribute('data-bib-html', JSON.stringify({ record: `<p>${bibRecord}</p>` }));
        link.setAttribute('rel', 'source');
        link.setAttribute('title', `${bibRecord.replace(/(<([^>]+)>)/ig, '')}${title ? ', ' : ''}${title}`);

        link.classList.add('bibliography');
        link.classList.add(`bib-${bibItems.json[key].type}`);
      }
    }
  });
};

module.exports = { build, domEnhanceBibLinks };
