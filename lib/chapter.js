const dot = require('dot');
const md = require('markdown-it')()
	.use(require('markdown-it-footnote'));

const build = (templateFn, data, meta) => {

	meta.content = [
		removeHtmlComments,
		renderMarkdown
	].reduce((acc, fn) => fn(acc), data);

	return templateFn(meta);	
}

const loadTemplates = tplDir => dot.process({ path: tplDir });

const removeHtmlComments = text => text.replace(/<!--.+?-->/g, '');

const renderMarkdown = text => md.render(text);

module.exports = { build, loadTemplates };
