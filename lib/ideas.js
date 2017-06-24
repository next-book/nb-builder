const appendIdea = (acc, dom) => {
  const span = dom.window.document.createElement('SPAN');
  span.classList.add('idea');
  acc.push(span);
};

const appendNodeToIdea = (acc, node) => acc[acc.length - 1].appendChild(node);

const appendText = (acc, text, dom) =>
  appendNodeToIdea(acc, dom.window.document.createTextNode(text));

const parseIdeas = (dom, childNodes) => childNodes.reduce((ideas, node) => {
  if (ideas.length === 0 || ideas[ideas.length - 1].nodeName !== 'SPAN') {
    appendIdea(ideas, dom);
  }

  if (node.nodeType === 3) {
    node.textContent.split('\n').map((part, index) => {
      if (index !== 0) appendIdea(ideas, dom);
      appendText(ideas, part, dom);
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
    
    const wordsCount = idea.textContent.split(/\s+/g).length
    idea.setAttribute('data-nb-words', wordsCount);
    wordsTotal += wordsCount;
  });

  el.setAttribute('data-nb-chars', charsTotal);
  el.setAttribute('data-nb-words', wordsTotal);
};

const describeDocument = (dom) => {
  const ideas = dom.window.document.querySelectorAll('.idea');
  const totals = Array.prototype.reduce.call(ideas, (totals, idea, index) => {
    idea.setAttribute('id', `idea${index+1}`);
    totals.chars += parseInt(idea.getAttribute('data-nb-chars'), 10);
    totals.words += parseInt(idea.getAttribute('data-nb-words'), 10);
    return totals;
  }, { words: 0, chars: 0 });
  
  const body = dom.window.document.querySelector('body');
  body.setAttribute('data-nb-chars', totals.chars);
  body.setAttribute('data-nb-words', totals.words);
}

const markIdeas = (dom) => {
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


module.exports = { build: markIdeas };
