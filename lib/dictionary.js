const jsdom = require('jsdom');
const { applyHTMLToTextNodes } = require('./domHelpers');
const md = require('markdown-it')();
const yaml = require('js-yaml');
const fs = require('fs');

// insert
const regexEscape = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const addLinks = items => (text) => {
  return items.reduce((acc, item, index) => {
    let forms = [item.term];
    
    if (item.forms) {
      forms = [item.term, ...item.forms.split(', ')];  
    }
    
    return forms.reduce((acc, form) => {
      return acc.replace(
        new RegExp(`(^|[\\s,.;(])(${regexEscape(form.trim())})($|[\\s,.;&)])`, 'ig'), 
        `$1<span id="term${index}" class="dictionary-term" data-dictionary-term="${item.term}" data-term-index="${index}">$2</span>$3`
      );
    }, acc);
  }, text);
};

const domAddLinks = items => (dom) => {
  const body = dom.window.document.querySelector('body');
  applyHTMLToTextNodes(body)(addLinks(items));
}


// map
const findIdeaId = (node) => {
  if (node.parentNode.classList.contains('idea')) {
    return parseInt(node.parentNode.getAttribute('id').replace('idea', ''));
  } else {
    return findIdeaId(node.parentNode);
  }
}

const mapItems = files => {
  const map = files.reduce((map, file) => {
    const dom = new jsdom.JSDOM(file.content);
    const items = dom.window.document.querySelectorAll('.dictionary-term');
    let index = 0;
    if (items && items.length > 0) {
      file.meta.dictionaryMap = Array.prototype.slice.call(items).reduce((acc, item) => {
        index += 1;
        
        item.setAttribute('id', `dictionary-term${index}`);
        
        acc.push({
          term: item.getAttribute('data-dictionary-term'),
          idea: findIdeaId(item),
          id: index,
        });
        
        return acc;
      }, []);
    }
    return true;
  }, true);
  
  return files;
};


// build
const build = (items, files, templates) => {
  const content = items.reduce((acc, item, index) => {
    const def = item.definition ? md.renderInline(item.definition) : '';
    
    const map = files.reduce((mapAcc, f) => {
      if (f.meta.dictionaryMap) {
      
        const appearances = f.meta.dictionaryMap.reduce((mapItemAcc, mapItem) => {
          if (item.term && item.term == mapItem.term) {
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
  defMeta.name = 'dictionary';
  defMeta.filename = 'dictionary.md';
  defMeta.next = 'index';
  defMeta.prev = 'index';
  defMeta.template = 'default';
  
  const file = { content: `<dl>${content}</dl>`, meta: defMeta };
    
  return [{
    name: 'dictionary',
    ext: 'html',
    filename: `dictionary.html`,
    meta: file.meta,
    content: templates(
      ({ content: file.content, meta: Object.assign({}, file.meta, { section: file.name, sectionNumber: parseInt(file.name) })}),
      file.meta.template ? file.meta.template : 'default'
    )
  }];
}


// load
const load = (dir) => { 
  try {
    return yaml.safeLoad(fs.readFileSync(`${dir}/items.yaml`, 'utf8'));
  } catch (e) {
    console.log(e);
  }
}


module.exports = { load, domAddLinks, mapItems, build }
