#! /usr/bin/env node

const cliArgs = require('command-line-args');
const args = cliArgs([
    { name: 'owner', type: String, defaultValue: 'John Doe' },
    { name: 'hash', type: String, defaultValue: 'abcdefgh' },
    { name: 'src', type: String, defaultValue: './src' },
    { name: 'out', type: String, defaultValue: './out' }
]);

const build = require('./../index.js');
build(args);
