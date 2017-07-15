const Citation = require('citation-js');
const fs = require('fs');
const yaml = require('js-yaml');

const conf = {
  format: 'string',
  type: 'html',
  style: 'citation-iso690-numeric-cs',
  lang: 'cs-CZ',
  template: null,
};

const removeComments = text => text.replace(/(^|\n)\s*#.+?\n/g, '\n');

const extractItems = (text) => {
  const items = removeComments(text).split('@');

  return items.map((item) => {
    let citation = null;
    if (item.trim()) {
      citation = new Citation(`@${item.trim()}`);
    }
    return citation;
  });
};

const load = (dir) => {
  const data = [fs.readFileSync(`${dir}/sources.bib`, 'utf8')];
  conf.template = fs.readFileSync(`${dir}/csl.xml`, 'utf8');

  const items = data.reduce((acc, text) => extractItems(text), []);

  return items.reduce((acc, item) => {
    if (item) acc.push(item);
    return acc;
  }, []);
};

const buildHtml = items => items.map(item => ({ id: item.get()[0].id, content: item.get(conf) }));

const buildJson = items => items.reduce((acc, item) => {
  acc[item.get()[0].id] = item.get()[0];
  return acc;
}, {});

const loadIndex = (dir) => { 
  try {
    return yaml.safeLoad(fs.readFileSync(`${dir}/definitions.yaml`, 'utf8'));
  } catch (e) {
    console.log(e);
  }
  
}

module.exports = { load, loadIndex, buildJson, buildHtml };
