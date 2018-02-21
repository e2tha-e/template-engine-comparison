'use strict';

const start = Date.now();

process.chdir(__dirname);

const fs = require('fs');
const path = require('path');

const glob = require('glob');
const handlebars = require('handlebars');

const enc = 'utf8';
const buildDir = 'build';
const partials = {};
const partialsDir = 'partials-7';
const partialFiles = glob.sync('**/*.hbs', {cwd: partialsDir});

// Prep cleanup.
fs.readdirSync(buildDir).forEach((file) => {
  if (file.charAt(0) === '.') {
    return;
  }

  fs.unlinkSync(`${buildDir}/${file}`);
});

for (let file of partialFiles) {
  handlebars.registerPartial(file, fs.readFileSync(path.resolve(partialsDir, file), enc));
}

const dataOptions = {
  '00-page--element': [{content: 'lorem'}],
  '01-page--element': [{content: 'ipsum'}],
  '02-page--element': [{content: 'dolor'}],
  '03-page--element': [{content: 'sit'}],
  '04-page--element': [{content: 'amet'}],
  '05-page--element': [{content: 'consectetur'}],
  '06-page--element': [{content: 'adipisicing'}]
};
const sourceDir = 'source-7';
const sourceFiles = glob.sync('**/*.hbs', {cwd: sourceDir});

for (let file of sourceFiles) {
  const basename = path.basename(file, '.hbs');
  const targetTag = `${basename}--element`;
  const sourceText = fs.readFileSync(path.resolve(sourceDir, file), enc);
  const data = {};

  data[targetTag] = dataOptions[targetTag];

  const template = handlebars.compile(sourceText);
  const buildText = template(data);

  fs.writeFileSync(`build/${basename}.txt`, buildText);
}

const stop = Date.now();
const elapsed = (stop - start) / 1000;
const used = process.memoryUsage().heapUsed / 1024 / 1024;

console.log(`Time elapsed: ${Math.round(elapsed * 100) / 100} sec`);
console.log(`Memory used: ${Math.round(used * 100) / 100} MB`);
