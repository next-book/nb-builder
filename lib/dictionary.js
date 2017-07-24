const jsdom = require('jsdom');
const { applyHTMLToTextNodes } = require('./domHelpers');
const md = require('markdown-it')();
const yaml = require('js-yaml');
const fs = require('fs');

// mark
const regexEscape = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const linkTerms = terms => (text) => {
  return terms.reduce((acc, term, index) => {
    let forms = [term.heading];
    
    if (term.forms) {
      forms = [term.heading, ...term.forms.split(', ')];
    }
    
    return forms.reduce((acc, form) => {
      return acc.replace(
        new RegExp(`(^|[\\s,.;(])(${regexEscape(form.trim())})($|[\\s,.;&)])`, 'ig'), 
        `$1<span id="dictionary-term${index}" class="dictionary-term" data-dictionary-term="${term.heading}" data-term-index="${index}">$2</span>$3`
      );
    }, acc);
  }, text);
};

const domLinkTerms = terms => (dom) => {
  const body = dom.window.document.querySelector('body');
  applyHTMLToTextNodes(body)(linkTerms(terms));
}


// map
const findIdeaId = (node) => {
  if (node.parentNode.classList.contains('idea')) {
    return parseInt(node.parentNode.getAttribute('id').replace('idea', ''));
  } else {
    return findIdeaId(node.parentNode);
  }
};

const mapTerms = files => Array.prototype.concat(
  ...files.map((file) => {
    const dom = new jsdom.JSDOM(file.content);
    const terms = dom.window.document.querySelectorAll('.dictionary-term');
    
    if (terms.length) return Array.prototype.slice.call(terms)
      .map((term, index) => ({
        chapter: file.name,
        heading: term.getAttribute('data-dictionary-term'),
        idea: findIdeaId(term),
        id: index + 1,
      })
    );
    else return [];
  }
));


// build
const groupLocationsByTerm = (terms, map) => terms.map((term, index) => ({
  index,
  heading: term.heading,
  definition: term.definition,
  map: map
    .filter(loc => loc.heading == term.heading)
    .map(loc => ({
      chapter: loc.chapter,
      idea: loc.idea,
      id: loc.id
    })
  ),
}));

const renderLocations = map => {
  if (map.length == 0) return '—';
  else return map.reduce((links, loc) => {
    links.push(`<a href="${loc.chapter}.html#idea${loc.idea}">${parseInt(loc.chapter)}:${loc.idea}</a>`);
    return links;
  }, []).join(', ')
};

const renderDefinition = def => def ? md.renderInline(def) : '';

const renderTerms = terms => terms.map(term => 
  `<dt id="term${term.index}">${term.heading} (${renderLocations(term.map)})</dt>
    <dd>${renderDefinition(term.definition)}</dd>`
).join('');

const build = (terms, meta, files, templates) => {
  const content = renderTerms(groupLocationsByTerm(terms, mapTerms(files)));
  
  const file = { 
    content: `<dl>${content}</dl>`,
    meta: Object.assign({}, meta, {
      title: 'Rejstřík',
      name: 'dictionary',
    }),
  };
    
  return [{
    name: 'dictionary',
    ext: 'html',
    filename: `dictionary.html`,
    meta: file.meta,
    content: templates(file, 'default')
  }];
}


// load
const load = (dir) => { 
  try {
    const terms = yaml.safeLoad(fs.readFileSync(`${dir}/terms.yaml`, 'utf8'));
    return terms.map(term => {
      Object.defineProperty(term, 'heading',
        Object.getOwnPropertyDescriptor(term, 'term'));
        delete term['term'];
      return term;
    });
  } catch (e) {
    console.log(e);
  }
}


module.exports = { load, domLinkTerms, build }
