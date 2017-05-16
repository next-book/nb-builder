const Citation = require('citation-js');

const parse = data => {
	const items = data.reduce((acc, text) => extractItems(text), []);
	return items.reduce((acc, item) => {
		if (item) acc[item.id] = item;
		return acc;
	}, {});
};

const extractItems = text => {
	const items = removeComments(text).split('@');
	return items.map(item => {
		if (item.trim()) {
			return new Citation('@' + item.trim()).get()[0];
		}
	});
};

const removeComments = text => text.replace(/(^|\n)\s*#.+?\n/g, '\n');

module.exports = { parse };
