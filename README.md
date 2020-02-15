# Template Engine Benchoff

#### Update: 2020 February

This repository is primarily being maintained for the purpose of providing a 
test bed on which to benchmark future versions of Feplet. While it is compared 
against Handlebars, it is unlikely that anyone will abandon Handlebars on 
account of performance. The tests herein only benchmark edge cases, and build 
times of 20 seconds or more will almost never be experienced in production. Even 
if such cases actually occur, most teams will readily accept those costs, given 
that Handlebars is widely known, tried and tested, and so forth. Furthermore, 
very few people actually care whether a functional or imperative programming 
paradigm is used under the hood of a software package. What is important to both 
the developers and consumers of Feplet is that the implemented paradigm 
(functional) does not offer an inferior experience to the alternative 
(imperative).

If the generalizations about public disinterest in this benchoff can be allowed 
as givens (i.e. not requiring scientific rigor), we'll proceed then with 
maintaining this readme with occasional updates incorporating new information.

### Abstract

These are a series of tests benchmarking the 
<a href="https://github.com/electric-eloquence/feplet" target="_blank">Feplet</a> 
and Handlebars JavaScript template engines. They both use the Mustache template 
engine as a starting point, and extend it with the ability to submit data 
parameters to partials, along with some additional modifications great and 
small. In the benchmarking of Feplet, we also want to ensure that the 
functionally programmed package does not significantly underperform its 
imperative equivalent.

### Some Background on Feplet

Feplet was initially written in the functional paradigm out of a desire to wear 
the latest fashion of the time, as well as out of genuine curiosity at how 
functional programming would play out in the real world of deadlines and profit 
margins. In the case of Feplet, functional programming turns out to be more 
verbose than imperative programming. It isn't the way most people are introduced 
to programming, so the functional code could be hard to follow for the 
uninitiated.

However, the functional paradigm wasn't just tacked on willy-nilly. For Feplet, 
recursion was unavoidable since template tags are nestable, and recursion is the 
only reasonable way to dive into nested structures. It was not much of an 
architectural leap to ensure that all functions returned values, and that they 
didn't mutate data outside their scopes.

<a href="#imperative-vs-functional">A deeper dive into functional programming.</a>

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
* Feplet imperative: 23K
* Handlebars: 78K

### Tests

The engines need to compile and render patterns grouped within 5 pattern types:

* pages
* templates
* components
* compounds
* elements

The engines start reading from within the `pages` type, and recursively include 
partials from each successive pattern type. The first test has six patterns per 
pattern type. The second test has seven. These tests don't just include partials 
from top down. There are some blocks which include partials from pattern types 
higher up, which in turn continue the downward course of inclusion. 
Parameterized logic prevents these circular execution paths from being infinite.

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

### Imperative vs. Functional

In the case of Feplet, "functional" could not simply mean 
"`map().filter().reduce()`", repeat. It also could not mandate that data 
structures, like arrays and plain objects, be treated as atomic pieces of 
immutable data. In Feplet, functions process data, their final forms being 
immutable, and append them to such data structures. Destroying and 
reinstantiating data structures any time new data needed to be added, would 
hamper performance for no benefit other than resembling other projects that 
treat data structures as atomic and immutable. JavaScript projects that destroy 
and reinstantiate data structures, _actually_ destroy those data structures and 
reinstantiate them in _actual_ new memory addresses, given that JavaScript is 
_not_ a purely functional language, and its implementations generally do not 
optimize functionally programmed instructions the way purely functional 
languages do.

Imperative Feplet is actually pretty functional, given that it heavily and 
unavoidably employs recursion. The imperative parts are mostly for-loops. 
Functional Feplet replaces those for-loops with recursive functions.

#### Imperative Feplet

```javascript
var paramsApply = function (args) {
  const {
    contextKeys,
    delimiterUnicodes_,
    paramKeys,
    paramsObj,
    partialParseArr,
    partialText_
  } = args;

  let _delimiterUnicodes;
  let partialText;

  for (let i = 0, l = partialParseArr.length; i < l; i++) {
    const parseObj = partialParseArr[i];
    let delimiterUnicodes;

    ({
      delimiterUnicodes,
      partialText
    } = paramsApplyToParseObj({
      contextKeys,
      delimiterUnicodes_,
      paramKeys,
      paramsObj,
      parseObj,
      partialText_: partialText || partialText_
    }));

    _delimiterUnicodes = _delimiterUnicodes || delimiterUnicodes || delimiterUnicodes_;
  }

  return {
    delimiterUnicodes: _delimiterUnicodes,
    partialText: partialText || partialText_
  };
};
```

#### Functional Feplet

```javascript
var paramsApply = function (args) {
  const {
    contextKeys,
    delimiterUnicodes_,
    paramKeys,
    paramsObj,
    partialParseItr,
    partialParseItrn,
    partialText_
  } = args;

  if (partialParseItrn.done) {
    return {
      delimiterUnicodes: delimiterUnicodes_,
      partialText: partialText_
    };
  }

  const parseObj = partialParseItrn.value;
  const parseObjKeys = Object.keys(parseObj);
  let delimiterUnicodes;
  let partialText;

  if (parseObjKeys.length) {
    const parseObjKeysItr = parseObjKeys[Symbol.iterator]();
    const parseObjKeysItrn = parseObjKeysItr.next();
    ({
      delimiterUnicodes,
      partialText
    } = paramsApplyToParseObj({
      contextKeys,
      delimiterUnicodes_,
      paramKeys,
      paramsObj,
      parseObj,
      parseObjKeysItr,
      parseObjKeysItrn,
      partialText_
    }));
  }

  args.delimiterUnicodes_ = delimiterUnicodes || delimiterUnicodes_;
  args.partialParseItrn = partialParseItr.next();
  args.partialText_ = partialText || partialText_;

  return paramsApply(args);
};
```

The big difference between the imperative and functional code examples is that 
the imperative code employs a for-loop to iteratively invoke 
`paramsApplyToParseObj()`, whereas the functional code invokes 
`paramsApplyToParseObj()` once, wherein it recurses into itself until the 
`parseObjKeysItr` object's `.next()` method returns a `parseObjKeysItrn` object 
with property `.done` === `true`. While the code to `paramsApplyToParseObj()` is 
not shown, it can be inferred that it treats `parseObjKeysItr` and 
`parseObjKeysItrn` the same way `paramsApply()` treats `partialParseItr` and 
`partialParseItrn`.

Given that imperative and functional Feplet are equivalent in performance, and 
that functional is more verbose than imperative, why choose functional over 
imperative?

Any answer to that is subjective. The package size difference is so small that 
it is not a compelling reason. Both paradigms can be criticized as being hard to 
follow. Functional because it is functional. Imperative because for-loops do 
nothing but cause side-effects, and they don't explicitly declare which data 
they mutate. Case in point:

```
_delimiterUnicodes = _delimiterUnicodes || delimiterUnicodes || delimiterUnicodes_;
```

Feplet was a great learning experience, and as such, it certainly _feels_ 
worthwhile to have adopted the functional programming paradigm. But even if we 
had to make a similar choice for a new project, and nothing new was to be 
learned, it is a great exercise in discipline to stay focused implementing a 
paradigm that best fits the needs of a project. You'll find that this pays off 
when optimizing performance, and in the course of maintaining a project.

Consider the alternative: Being undisciplined and unfocused. It is an excellent 
strategy for starring in reality television. It is a good to excellent strategy 
for separating donors, lenders, and buyers from their money. But it is a 
terrible strategy for software engineering!

### Also

<h4><a href="https://github.com/electric-eloquence/feplet-vs-patternlab-php" target="_blank">Feplet vs. Pattern Lab PHP &raquo;</a></h4>
