const jsdom = require('jsdom');
const { appendMeta, getMeta } = require('./domHelpers');

const appendIdea = (dom, acc) => {
  const span = dom.window.document.createElement('SPAN');
  span.classList.add('idea');
  acc.push(span);
};

const appendNodeToIdea = (acc, node) => acc[acc.length - 1].appendChild(node);

const appendText = (dom, acc, text) =>
  appendNodeToIdea(acc, dom.window.document.createTextNode(text));

const parseIdeas = (dom, childNodes) => childNodes.reduce((ideas, node) => {
  if (ideas.length === 0 || ideas[ideas.length - 1].nodeName !== 'SPAN') {
    appendIdea(dom, ideas);
  }

  if (node.nodeType === 3) {
    node.textContent.split('\n').map((part, index) => {
      if (index !== 0) appendIdea(dom, ideas);
      appendText(dom, ideas, part);
      return true;
    });
  } else {
    appendNodeToIdea(ideas, node);
  }

  return ideas;
}, []);

const describeIdeas = (el) => {
  const ideas = el.querySelectorAll('.idea');
  let index = 1;
  let charsTotal = 0;
  let wordsTotal = 0;

  Array.prototype.map.call(ideas, (idea) => {
    idea.setAttribute('data-nb-ref-number', index);
    index += 1;

    const charsCount = idea.textContent.length;
    idea.setAttribute('data-nb-chars', charsCount);
    charsTotal += charsCount;

    const wordsCount = idea.textContent.split(/\s+/g).length;
    idea.setAttribute('data-nb-words', wordsCount);
    wordsTotal += wordsCount;
  });

  el.setAttribute('data-nb-chars', charsTotal);
  el.setAttribute('data-nb-words', wordsTotal);
};


const describeDocument = (dom) => {
  const ideas = dom.window.document.querySelectorAll('.idea');
  const totals = Array.prototype.reduce.call(ideas, (total, idea, index) => {
    idea.setAttribute('id', `idea${index + 1}`);
    total.chars += parseInt(idea.getAttribute('data-nb-chars'), 10);
    total.words += parseInt(idea.getAttribute('data-nb-words'), 10);
    return total;
  }, { words: 0, chars: 0 });

  appendMeta(dom, 'charCount', totals.chars);
  appendMeta(dom, 'wordCount', totals.words);
};

const mapIdeas = (dom) => {
  const els = dom.window.document.querySelectorAll('p, li, dd, dt, h1, h2, h3, h4, h5, h6, blockquote');

  Array.prototype.map.call(els, (el) => {
    const childNodes = Array.prototype.slice.call(el.childNodes);

    const ideas = parseIdeas(dom, childNodes);
    el.innerHTML = '';
    ideas.map((r) => {
      el.appendChild(dom.window.document.createTextNode('\n'));
      el.appendChild(r, el);
      return true;
    });

    describeIdeas(el);
  });

  describeDocument(dom);
};

const mapChunks = (dom) => {
  const els = dom.window.document.querySelectorAll('p, ul, h1, h2, h3, h4, h5, h6, blockquote, dl, table');

  let i = 1;
  Array.prototype.map.call(els, (el) => {
    el.classList.add('chunk');
    el.setAttribute('data-nb-ref-number', i);
    i += 1;
  });
};


const addCounts = (files) => {
  const totals = { chars: 0, words: 0 };

  const doms = files
    .map((file) => {
      const dom = new jsdom.JSDOM(file.content);
      if (file.meta.stats === 'exclude') {
        appendMeta(dom, 'excludedFromStats', 'true');
      } else {
        const chars = parseInt(getMeta(dom, 'charCount'), 10);
        const words = parseInt(getMeta(dom, 'wordCount'), 10);
        appendMeta(dom, 'charPosition', totals.chars);
        appendMeta(dom, 'wordPosition', totals.words);
        totals.chars += chars;
        totals.words += words;
      }
      return dom;
    });

  return doms.map((dom, index) => {
    appendMeta(dom, 'publicationCharCount', totals.chars);
    appendMeta(dom, 'publicationWordCount', totals.words);

    files[index].content = dom.serialize();
    return files[index];
  });
};


const build = (dom) => {
  mapChunks(dom);
  mapIdeas(dom);
};

module.exports = { build, addCounts };
