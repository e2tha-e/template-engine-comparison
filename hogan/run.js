'use strict';

const start = Date.now();

process.chdir(__dirname);

const fs = require('fs');
const path = require('path');

const hogan = require('hogan.js');
const glob = require('glob');

const enc = 'utf8';
const buildDir = 'build';
const partialsDir = 'partials';
const partialFiles = glob.sync('**/*.hgn', {cwd: partialsDir});

// Prep cleanup.
fs.readdirSync(buildDir).forEach((file) => {
  if (file.charAt(0) === '.') {
    return;
  }

  fs.unlinkSync(`${buildDir}/${file}`);
});

const data = {
  lorem: 'lorem',
  ipsum: 'ipsum',
  dolor: 'dolor',
  sit: 'sit',
  amet: 'amet'
};
const partials = {};

for (let file of partialFiles) {
  partials[file] = fs.readFileSync(path.resolve(partialsDir, file), enc);
}

const sourceDir = 'source';
const sourceFiles = glob.sync('**/*.hgn', {cwd: sourceDir});

for (let file of sourceFiles) {
  const basename = path.basename(file, '.hgn');
  const sourceText = fs.readFileSync(path.resolve(sourceDir, file), enc);
  const template = hogan.compile(sourceText);
  const buildText = template.render(
    data,
    partials
  );

  fs.writeFileSync(`build/${basename}.txt`, buildText);
}

const stop = Date.now();
const elapsed = (stop - start) / 1000;
const used = process.memoryUsage().heapUsed / 1024 / 1024;

console.log(`Time elapsed: ${Math.round(elapsed * 100) / 100} sec`);
console.log(`Memory used: ${Math.round(used * 100) / 100} MB`);
