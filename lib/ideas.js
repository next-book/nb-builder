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
  let totalLength = 0;

  Array.prototype.map.call(ideas, (idea) => {
    idea.setAttribute('data-nb-ref-number', index);
    index += 1;

    idea.setAttribute('data-nb-length', idea.textContent.length);
    totalLength += idea.textContent.length;
  });

  return totalLength;
};

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

    const totalLength = describeIdeas(el);
    el.setAttribute('data-nb-length', totalLength);
  });
};


module.exports = { mark: markIdeas };
