const jsdom = require('jsdom');

const appendMeta = (dom, name, content) => {
  const el = dom.window.document.createElement('meta');
  el.setAttribute('name', name);
  el.setAttribute('content', content);
  dom.window.document.querySelector('head').appendChild(el);
};

const getMeta = (dom, name) => {
  const el = dom.window.document.querySelector(`meta[name="${name}"]`);
  return el ? el.getAttribute('content') : null;
};

const appendLink = (dom, rel, href) => {
  const el = dom.window.document.createElement('link');
  el.setAttribute('rel', rel);
  el.setAttribute('href', href);
  dom.window.document.querySelector('head').appendChild(el);
};


const applyHTMLToTextNodes = node => (fn) => {
  if (node.nodeType === 3) {
    // wrapped in <section> to preserve whitespace
    const updated = new jsdom.JSDOM(`<body><section>${fn(node.textContent)}</section></body>`);
    const newNodes = updated.window.document.querySelector('body > section').childNodes;

    Array.prototype.slice.call(newNodes)
      .map(newNode => node.parentNode.insertBefore(newNode, node));

    node.remove();
  } else {
    Array.prototype.slice.call(node.childNodes)
      .map(childNode => applyHTMLToTextNodes(childNode)(fn));
  }
};

const applyToTextNodes = node => (fn) => {
  if (node.nodeType === 3) {
    node.textContent = fn(node.textContent);
  } else {
    Array.prototype.slice.call(node.childNodes)
      .map(childNode => applyToTextNodes(childNode)(fn));
  }
};


module.exports = {
  appendMeta,
  getMeta,
  appendLink,
  applyHTMLToTextNodes,
  applyToTextNodes,
};
