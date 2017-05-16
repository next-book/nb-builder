const fs = require('fs');
const chapter = require('./lib/chapter');
const bib = require('./lib/bib');
const rimraf = require('rimraf');
const yaml = require('js-yaml');

const build = (args) => {
	const conf = yaml.safeLoad(fs.readFileSync(args.src + '/config.yaml', 'utf8'));
	
	const dirs = prepDirs(args.src, args.out, conf.dirs);
	
	console.log(dirs);
	
	const meta = {
		revision: require('./lib/revision').getRevision(dirs.src.root),
		date: new Date().toISOString()
	}
	
	// build style
	buildStyle(dirs.src.style, dirs.out.root);

	// load bibliography
	const citations = bib.parse([fs.readFileSync(dirs.src.bibliography + '/Bibliografie.md', 'utf8')]);

	// build navigation

	// build index

	// build pages
	const filenames = getChapterFilenames(dirs.src.text);
	buildChapters(filenames, dirs, meta);
	
	// write revision.json to build/ with git rev hash
	fs.writeFile(args.out + '/rev.json', JSON.stringify( { conf, meta, args } ), (err) => {
		if (err) throw err;
	});

	// write subscriber id
	fs.writeFile(args.out + '/subscriber.json', JSON.stringify(args), (err) => {
		if (err) throw err;
	});

	// write LICENSE.md
}



const buildStyle = (srcDir, outDir) => {
	const sass = require('node-sass');
	
	const sassConfig = { 
		file: srcDir + '/style.scss', 
		outFile: outDir + '/style/style.css',
		sourceMap: true
	};
	
	sass.render(sassConfig, (err, result) => {
		if (err) throw err;
		
		fs.mkdirSync(outDir + '/style');
		
		fs.writeFile(sassConfig.outFile, result.css.toString(), (err) => {
			if (err) throw err;
		});
		
		fs.writeFile(sassConfig.outFile + '.map', result.map.toString(), (err) => {
			if (err) throw err;
		});
	});
}

const prepDirs = (srcDir, outDir, confDirs) => {
	const src = Object.keys(confDirs).reduce((acc, key) => { acc[key] = srcDir + '/' + confDirs[key]; return acc; }, {});
	src.root = srcDir;
	console.log(src);
	
	const out = { root: outDir };

	if (fs.existsSync(out.root)) rimraf.sync(out.root);
	fs.mkdirSync(out.root);

	return { src, out };
}


const getChapterFilenames = srcDir => fs.readdirSync(srcDir).filter(file => file.match('^[0-9]+-'));

const buildChapters = (filenames, dirs, meta) => {
	const templateFn = chapter.loadTemplates(dirs.src.templates).chapter;
	
	filenames.map(file => {
		fs.readFile(dirs.src.text + '/' + file, 'utf8', (err, data) => {
			if (err) throw err;
			
			fs.writeFile(dirs.out.root + '/' + file + '.html', chapter.build(templateFn, data, meta), (err) => {
				if (err) throw err;
			});
		});
	});
}

module.exports = build;
