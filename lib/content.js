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
    ({ content: renderContent(file.content), meta: Object.assign({}, file.meta, { section: file.name, sectionNumber: parseInt(file.name) })}),
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


const addNbspCs = text => {
  let replace = [
    [/(\s)K /g, '$1K '], 
    [/(\s)k /g, '$1k '], 
    [/(\s)S /g, '$1S '], 
    [/(\s)s /g, '$1s '], 
    [/(\s)V /g, '$1V '], 
    [/(\s)v /g, '$1v '], 
    [/(\s)Z /g, '$1Z '], 
    [/(\s)z /g, '$1z '], 
    [/(\s)O /g, '$1O '], 
    [/(\s)o /g, '$1o '], 
    [/(\s)U /g, '$1U '], 
    [/(\s)u /g, '$1u '], 
    [/(\s)A /g, '$1A '], 
    [/(\s)I /g, '$1I '], 
    [/(\s)i /g, '$1i '],

    [/(\s)j\. č\./g, '$1j. č.'], 
    [/(\s)mn\. č\./g, '$1mn. č.'], 
    [/(\s)n\. l\./g, '$1n. l.'], 
    [/(\s)př\. n\. l\./g, '$1př. n. l.'], 
    [/(\s)č\. p\./g, '$1č. p.'], 
    [/(\s)t\. r\./g, '$1t. r.'], 
    [/(\s)t\. č\./g, '$1t. č.'], 
    [/(\s)v\. r\./g, '$1v. r.'], 
    [/(\s)n\. m\./g, '$1n. m.'], 
    [/(\s)tj\. /g, '$1tj. '], 
    [/(\s)tzv\. /g, '$1tzv. '],

    [/(\s)s\. /g, '$1s. '], 
    [/(\s)č\. /g, '$1č. '], 
    [/(\s)s\. r\. o\./g, '$1s. r. o.'], 
    [/(\s)r\. o\./g, '$1r. o.'], 
    [/(\s)a\. s\./g, '$1a. s.'], 
    [/(\s)k\. s\./g, '$1k. s.'], 
    [/(\s)v\. o\. s\./g, '$1v. o. s.'],

    [/(\s)Bc\. /g, '$1Bc. '], 
    [/(\s)Mgr\. /g, '$1Mgr. '], 
    [/(\s)Ing\. /g, '$1Ing. '], 
    [/(\s)Ph\.?D\. /g, '$1Ph.D. '], 
    [/(\s)LL\.B\. /g, '$1LL.B. '], 
    [/(\s)MUDr\. /g, '$1MUDr. '], 
    [/(\s)prof\. /g, '$1prof. '],

    [/(\s)čet\. /g, '$1čet. '], 
    [/(\s)rtm\. /g, '$1rtm. '], 
    [/(\s)por\. /g, '$1por. '], 
    [/(\s)kpt\. /g, '$1kpt. '], 
    [/(\s)plk\. /g, '$1plk. '], 
    [/(\s)gen\. /g, '$1gen. ']
  ];
  
  return replace.reduce((acc, item) => {
    return acc.replace(item[0], item[1].replace(/ /g, '&nbsp;'));
  }, text);
}
    

const domAddNbspCs = (dom) => {
  const body = dom.window.document.querySelector('body');
  applyToTextNodes(body)(addNbspCs);
};



const applyToTextNodes = node => (fn) => {
  if (node.nodeType === 3) {
    node.textContent = fn(node.textContent);
  } else {
    Array.prototype.slice.call(node.childNodes)
      .map(childNode => applyToTextNodes(childNode)(fn));
  }
};

const regexEscape = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const addIndexLinks = indexItems => (text) => {
  return indexItems.reduce((acc, item, index) => {
    let forms = [item.term];
    
    if (item.forms) {
      forms = [item.term, ...item.forms.split(', ')];  
    }
    
    return forms.reduce((acc, form) => {
      return acc.replace(
        new RegExp(`(^|[\\s,.;(])(${regexEscape(form.trim())})($|[\\s,.;&)])`, 'ig'), 
        `$1<span id="term${index}" class="index-entry" data-index-entry="${item.term}" data-term-index="${index}">$2</span>$3`
      );
    }, acc);
  }, text);
};

const findIdeaId = (node) => {
  if (node.parentNode.classList.contains('idea')) {
    return parseInt(node.parentNode.getAttribute('id').replace('idea', ''));
  } else {
    return findIdeaId(node.parentNode);
  }
}

const mapIndexItems = files => {
  const map = files.reduce((map, file) => {
    const dom = new jsdom.JSDOM(file.content);
    const entries = dom.window.document.querySelectorAll('.index-entry');
    let index = 0;
    if (entries && entries.length > 0) {
      file.meta.indexMap = Array.prototype.slice.call(entries).reduce((acc, entry) => {
        index += 1;
        
        entry.setAttribute('id', `index-entry${index}`);
        
        acc.push({
          entry: entry.getAttribute('data-index-entry'),
          idea: findIdeaId(entry),
          id: index,
        });
        
        return acc;
      }, []);
    }
    return true;
  }, true);
  
  return files;
};

const buildDefinitionsList = (items, files, templates) => {
  const content = items.reduce((acc, item, index) => {
    const def = item.definition ? md.renderInline(item.definition) : '';
    
    const map = files.reduce((mapAcc, f) => {
      if (f.meta.indexMap) {
      
        const appearances = f.meta.indexMap.reduce((mapItemAcc, mapItem) => {
          if (item.term && item.term == mapItem.entry) {
            mapItemAcc.push({ 
              chapter: f.name,
              idea: mapItem.idea,
              id: mapItem.id
            });
          }
          
          return mapItemAcc;
        }, []);
        
        if (appearances.length > 0) {
          mapAcc = mapAcc.concat(appearances);
        }
      }
      
      return mapAcc;
    }, []);
    
    const mapString = map.length == 0 ? '—' : map.reduce((links, appearance) => {
      links.push(`<a href="${appearance.chapter}.html#idea${appearance.idea}">${parseInt(appearance.chapter)}:${appearance.idea}</a>`);
      return links;
    }, []).join(', ');
    
    acc += `<dt id="term${index}">${item.term} (${mapString})</dt><dd>${def}</dd>`;
    return acc;
  }, '');
  
  const defMeta = Object.assign({}, files[0].meta);
  defMeta.title = 'Rejstřík';
  defMeta.name = 'definitions';
  defMeta.filename = 'definitions.md';
  defMeta.next = 'index';
  defMeta.prev = 'index';
  defMeta.template = 'default';
  
  const file = { content: `<dl>${content}</dl>`, meta: defMeta };
    
  return [{
    name: 'definitions',
    ext: 'html',
    filename: `definitions.html`,
    meta: file.meta,
    content: templates[file.meta.template ? file.meta.template : 'default']
      ({ content: file.content, meta: Object.assign({}, file.meta, { section: file.name, sectionNumber: parseInt(file.name) })}),
  }];
}

const domAddIndexLinks = indexItems => (dom) => {
  const body = dom.window.document.querySelector('body');
  applyHTMLToTextNodes(body)(addIndexLinks(indexItems));
}

const applyHTMLToTextNodes = node => (fn) => {
  if (node.nodeType === 3) {
    let updated = new jsdom.JSDOM('<body><section>' + fn(node.textContent) + '</section></body>'); // wrapped in <section> to preserve whitespace
    let newNodes = updated.window.document.querySelector('body > section').childNodes;
    
    Array.prototype.slice.call(newNodes)
      .map(newNode => node.parentNode.insertBefore(newNode, node));
    
    node.remove();
  } else {
    Array.prototype.slice.call(node.childNodes)
      .map(childNode => applyHTMLToTextNodes(childNode)(fn));
  }
};

const domEdits = (bibItemsJson, bibItemsHtml, indexItems) => files => files.map((file) => {
  const dom = new jsdom.JSDOM(file.content);
  
  domAddDocRefNumber(file)(dom);
  domAddElsRefNumbers(dom);
  ideas.build(dom);
  domAddNbspCs(dom);
  domAddIndexLinks(indexItems)(dom);
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
};


const build = (content, templates, meta, bibItemsJson, bibItemsHtml, indexItems) => pipe(
  addMeta(meta),
  extractFrontMatter,
  addNavigation,
  appendNotes(content.notes),
  buildChapter(templates),
  domEdits(bibItemsJson, bibItemsHtml, indexItems),
  addCounts,
  mapIndexItems)([content.license, content.index, ...content.chapters]);

//const buildDefinitionsList(indexItems, content.chapters, templates['default'])

module.exports = { build, buildDefinitionsList };
