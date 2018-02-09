'use strict';

const start = Date.now();

process.chdir(__dirname);

const fs = require('fs');
const path = require('path');

const hogan = require('./hogan.js/lib/hogan.js');
const glob = require('glob');

const enc = 'utf8';
const buildDir = 'build';
const partials = {};
const partialsDir = 'partials-1';
const partialFiles = glob.sync('**/*.fpt', {cwd: partialsDir});

// Prep cleanup.
fs.readdirSync(buildDir).forEach((file) => {
  if (file.charAt(0) === '.') {
    return;
  }

  fs.unlinkSync(`${buildDir}/${file}`);
});

for (let file of partialFiles) {
  partials[file] = fs.readFileSync(path.resolve(partialsDir, file), enc);
}

const data = {
  lorem: 'lorem',
  ipsum: 'ipsum',
  dolor: 'dolor',
  sit: 'sit',
  amet: 'amet'
};
const sourceDir = 'source-1';
const sourceFiles = glob.sync('**/*.fpt', {cwd: sourceDir});

for (let file of sourceFiles) {
  const basename = path.basename(file, '.fpt');
  const sourceText = fs.readFileSync(path.resolve(sourceDir, file), enc);
  const template = hogan.compile(sourceText);
  const buildText = template.render(
    data,
    partials
  );

  fs.writeFileSync(`build/${basename}.txt`, buildText);
}

const stop = Date.now();
const elapsed = stop - start;
const used = process.memoryUsage().heapUsed / 1024 / 1024;

console.log(`Time elapsed: ${elapsed} ms`);
console.log(`Memory used: ${Math.round(used * 100) / 100} MB`);
