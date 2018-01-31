'use strict';

const start = Date.now();

process.chdir(__dirname);

const fs = require('fs');
const path = require('path');

const feplet = require('feplet');
const glob = require('glob');

const enc = 'utf8';
const buildDir = 'build';
const partials = {};
const partialsDir = 'partials';
const partialFiles = glob.sync('**/*.fpt', {cwd: partialsDir});

// Prep cleanup.
fs.readdirSync(buildDir).forEach((file) => {
  fs.unlinkSync(`${buildDir}/${file}`);
});

for (let file of partialFiles) {
  partials[file] = fs.readFileSync(path.resolve(partialsDir, file), enc);
}

const dataOptions = {
  '00-page~~element': [{content: 'lorem'}],
  '01-page~~element': [{content: 'ipsum'}],
  '02-page~~element': [{content: 'dolor'}],
  '03-page~~element': [{content: 'sit'}],
  '04-page~~element': [{content: 'amet'}]
};
const sourceDir = 'source';
const sourceFiles = glob.sync('**/*.fpt', {cwd: sourceDir});

for (let file of sourceFiles) {
  const basename = path.basename(file, '.fpt');
  const targetTag = `${basename}~~element`;
  const sourceText = fs.readFileSync(path.resolve(sourceDir, file), enc);
  const data = {};

  data[targetTag] = dataOptions[targetTag];

  const buildText = feplet.render(
    sourceText,
    data,
    partials
  );

  fs.writeFileSync(`build/${basename}.txt`, buildText);
}

const end = Date.now();
const elapsed = (end - start) / 1000;
const used = process.memoryUsage().heapUsed / 1024 / 1024;

console.log(`Time elapsed: ${Math.round(elapsed * 100) / 100} sec`);
console.log(`Memory used: ${Math.round(used * 100) / 100} MB`);
