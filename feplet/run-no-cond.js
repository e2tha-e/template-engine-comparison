'use strict';

const start = Date.now();

process.chdir(__dirname);

const fs = require('fs');
const path = require('path');

const Feplet = require('feplet');
const glob = require('glob');

const enc = 'utf8';
const buildDir = 'build';
const partialsDir = 'partials-no-cond';
const partialFiles = glob.sync('**/*.fpt', {cwd: partialsDir});

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

let partials;
let partialsComp;
let start1;
let stop1;
let elapsed1;

start1 = Date.now();

for (let file of partialFiles) {
  ({
    partials,
    partialsComp
  } = Feplet.registerPartial(file, fs.readFileSync(path.resolve(partialsDir, file), enc), null, partials, partialsComp));
}

stop1 = Date.now();
elapsed1 = stop1 - start1;
console.log(`Time elapsed registering partials: ${elapsed1} ms`);

const sourceDir = 'source-no-cond';
const sourceFiles = glob.sync('**/*.fpt', {cwd: sourceDir});

start1 = Date.now();

for (let file of sourceFiles) {
  const basename = path.basename(file, '.fpt');
  const sourceText = fs.readFileSync(path.resolve(sourceDir, file), enc);
  const buildText = Feplet.render(
    sourceText,
    data,
    partials,
    partialsComp
  );

  fs.writeFileSync(`build/${basename}.txt`, buildText);
}

stop1 = Date.now();
elapsed1 = stop1 - start1;
console.log(`Time elapsed rendering pages: ${elapsed1} ms`);

const stop = Date.now();
const elapsed = (stop - start) / 1000;
const used = process.memoryUsage().heapUsed / 1024 / 1024;

console.log(`Time elapsed: ${Math.round(elapsed * 100) / 100} sec`);
console.log(`Memory used: ${Math.round(used * 100) / 100} MB`);
