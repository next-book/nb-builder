const dot = require('dot');

const build = (dir, publicationMetadata) => {
	const templates = dot.process({ path: dir });
	
	return (data, template) => templates[template](
		Object.assign({}, data, { publication: publicationMetadata })
	);
};

module.exports = { build };