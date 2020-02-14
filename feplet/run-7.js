'use strict';

const start = Date.now();

process.chdir(__dirname);

const fs = require('fs');
const path = require('path');

const Feplet = require('feplet');
const glob = require('glob');

const enc = 'utf8';
const buildDir = 'build';
const partialsDir = 'partials-7';
const partialFiles = glob.sync('**/*.fpt', {cwd: partialsDir});

// Prep cleanup.
fs.readdirSync(buildDir).forEach((file) => {
  if (file.charAt(0) === '.') {
    return;
  }

  fs.unlinkSync(`${buildDir}/${file}`);
});

const dataOptions = {
  'page-00~~element': [{content: 'lorem'}],
  'page-01~~element': [{content: 'ipsum'}],
  'page-02~~element': [{content: 'dolor'}],
  'page-03~~element': [{content: 'sit'}],
  'page-04~~element': [{content: 'amet'}],
  'page-05~~element': [{content: 'consectetur'}],
  'page-06--element': [{content: 'adipisicing'}]
};

let partials = {};
let partialsComp = {};

for (let file of partialFiles) {
  ({
    partials,
    partialsComp
  } = Feplet.registerPartial(file, fs.readFileSync(path.resolve(partialsDir, file), enc), null, partials, partialsComp));
}

const sourceDir = 'source-7';
const sourceFiles = glob.sync('**/*.fpt', {cwd: sourceDir});

for (let file of sourceFiles) {
  const basename = path.basename(file, '.fpt');
  const targetTag = `${basename}~~element`;
  const sourceText = fs.readFileSync(path.resolve(sourceDir, file), enc);
  const data = {};

  data[targetTag] = dataOptions[targetTag];

  const feplet = new Feplet(data, partials, partialsComp);
  const buildText = feplet.render(sourceText, data, partials);

  fs.writeFileSync(`build/${basename}.txt`, buildText);
}

const stop = Date.now();
const elapsed = (stop - start) / 1000;
const used = process.memoryUsage().heapUsed / 1024 / 1024;

console.log(`Time elapsed: ${Math.round(elapsed * 100) / 100} sec`);
console.log(`Memory used: ${Math.round(used * 100) / 100} MB`);
