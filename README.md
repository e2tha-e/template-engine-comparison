# Template Engine Benchoff

This currently only compares 
<a href="https://github.com/electric-eloquence/feplet" target="_blank">Feplet</a> 
to Handlebars. More template engines can be considered, so please 
<a href="https://github.com/electric-eloquence/template-engine-benchoff/issues" target="_blank">make suggestions</a>. 
They need to meet the following criteria at a minimum:

* Render tags that are nested within tags flagging true boolean conditions.
* Render tags that are nested within tags that loop through arrays of data.
* Compile partials with data passed to them by parameters from the including
  tag.
* Be written in JavaScript.

### Background

Feplet aims to extend Mustache, but without changing the existing syntax. In 
other words, Mustache code can be dropped into Feplet without modification. The 
extending functionality resembles other, more feature-rich engines, but as of 
this writing, no suggestion has been made for a JavaScript template engine that 
can accept Mustache code without modification, and extend it with the ability to 
submit data parameters to partials.

### Why Not Abandon Mustache?

Mustache brands itself as being "logic-less," but it in fact more closely 
resembles pure formal logic. It tests the most basic conditions: Is a value 
truthy or falsey? Is a value a set containing members? When true conditions have 
been drilled down to a printable value, print that value.

Of course, there's more to Mustache than just that, but the bells and whistles 
do not significantly weigh or slow Mustache down.

If a simpler set of rules (and a syntax to implement those rules) has been 
invented, 
<a href="https://github.com/electric-eloquence/template-engine-benchoff/issues" target="_blank"> 
please comment on what that is</a>. 
In the meantime, Feplet will not abandon Mustache.

### Versions

The latest as of this writing, 2020 February:

* Feplet: 1.2.0
* Handlebars: 4.7.3

### System

* MacBook Pro (Retina, 15-inch, Mid 2015)
* Intel Core i7-4980HQ @ 2.80GHz
* 16 GB 1600 MHz DDR3
* macOS Catalina 10.15.3 Host OS
* VirtualBox 6.1.2 r135662
* Ubuntu 18.04.3 LTS Bionic Guest OS

### Bundle Sizes

The minified all-in-one scripts for browser consumption:

* Feplet: 24K
* Handlebars: 78K

### Tests

The engines need to compile and render patterns grouped within 5 pattern types:

* pages
* templates
* components
* compounds
* elements

The engines start reading from within the `pages` type, and recursively include 
partials from each successive pattern type. The first test has seven patterns 
per pattern type. The second test has eight. These tests don't just include 
partials from top down. There are some blocks which include partials from 
pattern types higher up, which in turn continue the downward course of 
inclusion. Parameterized logic pervents these circular execution paths from 
being infinite.

### Benchmarks

Averages of ten runs:

#### 6 patterns per pattern type

* Feplet: 1.564 sec, 28.61 MB
* Feplet imperative: 1.58 sec, 28.371 MB
* Handlebars: 6.136 sec, 21.579 MB

#### 7 patterns per pattern type

* Feplet: 3.927 sec, 36.981 MB
* Feplet imperative: 3.908 sec, 37.167 MB
* Handlebars: 20.349 sec, 45.749 MB

### Do It Yourself

```shell
npm install
node feplet/run-6.js
node feplet-imperative/run-6.js
node handlebars/run-6.js
node feplet/run-7.js
node feplet-imperative/run-7.js
node handlebars/run-7.js
```

### Also

<h4><a href="https://github.com/electric-eloquence/feplet-vs-patternlab-php" target="_blank">Feplet vs. Pattern Lab for PHP &raquo;</a></h4>
