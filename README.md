# Template Engine Benchoff

#### Update: 2020 September

This repository is primarily being maintained for the purpose of providing a 
test bed on which to benchmark future versions of 
<a href="https://github.com/electric-eloquence/feplet" target="_blank">Feplet</a>. 
While it is compared against Handlebars, it is unlikely that anyone will abandon 
Handlebars on account of performance. The tests herein benchmark extreme cases, 
and the resultant build times of close to 20 seconds are unlikely to occur under 
normal usage. Even if such build times actually occur, most teams will readily 
accept those costs, given that Handlebars is widely known, tried and tested, and 
so forth. Furthermore, very few people actually care whether a functional or 
imperative programming paradigm is used under the hood of a software package. 
What is important to both the developers and consumers of Feplet is that the 
implemented paradigm (functional) does not offer an inferior experience to the 
alternative (imperative).

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
functional programming would play out in the "real world" of deadlines and 
profit margins. In the case of Feplet, functional programming turns out to be 
more verbose than imperative programming. It isn't the way most people are 
introduced to programming, so the functional code could also be hard to follow 
for the uninitiated.

However, the functional paradigm wasn't just tacked on willy-nilly. For Feplet, 
recursion was practically unavoidable since template tags are nestable, and 
recursion is the only practical way to dive into nested structures in 
JavaScript. It was not much of an architectural leap to ensure that all 
functions returned values, and that they didn't mutate data outside their 
scopes.

<a href="#imperative-vs-functional">A deeper dive into functional programming.</a>

### Versions

The latest as of this writing, 2020 September:

* Feplet: 1.2.2
* Handlebars: 4.7.6

### System

* MacBook Pro (Retina, 15-inch, Mid 2015)
* Intel Core i7-4980HQ @ 2.80GHz
* 16 GB 1600 MHz DDR3
* macOS Catalina 10.15.6 Host OS
* VirtualBox 6.1.2 r135662
* Ubuntu 20.04 LTS Focal Guest OS
* Node.js v12.16.2

### Bundle Sizes

The minified all-in-one scripts for browser consumption:

* Feplet: 25 KB
* Feplet imperative: 23 KB
* Handlebars: 78 KB

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

* Feplet: 1.628 sec, 28.283 MB
* Feplet imperative: 1.61 sec, 28.34 MB
* Handlebars: 5.87 sec, 21.63 MB

#### 7 patterns per pattern type

* Feplet: 4.04 sec, 37.38 MB
* Feplet imperative: 3.963 sec, 36.91 MB
* Handlebars: 17.40 sec, 46.06 MB

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

Imperative Feplet is actually pretty functional, given that it heavily and 
unavoidably employs recursion. To make Feplet more imperative, we've replaced 
`Array.prototype.reduce()` and recursive functions with for-loops where 
possible.

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
    paramKeys,
    paramsObj,
    parseObj
  } = args;
  let {
    delimiterUnicodes_,
    partialText
  } = args;

  const parseObjKeys = Object.keys(parseObj);
  let delimiterUnicodes;

  if (parseObjKeys.length) {
    const _this = this;

    ({
      delimiterUnicodes,
      partialText
    } = parseObjKeys.reduce(
      (dataStructures, parseObjKey) => {
        const {
          contextKeys,
          paramKeys,
          paramsObj,
          parseObj
        } = dataStructures;
        let {
          delimiterUnicodes,
          partialText
        } = dataStructures;

        ({
          delimiterUnicodes,
          partialText
        } = paramsApplyToParseObj.call(
          _this,
          {
            contextKeys,
            delimiterUnicodes_: delimiterUnicodes,
            paramKeys,
            paramsObj,
            parseObj,
            parseObjKey,
            partialText_: partialText
          }
        ));

        return {
          contextKeys,
          delimiterUnicodes,
          paramKeys,
          paramsObj,
          parseObj,
          partialText
        };
      },
      {
        contextKeys,
        delimiterUnicodes,
        paramKeys,
        paramsObj,
        parseObj,
        partialText
      }
    ));
  }

  return {
    delimiterUnicodes: delimiterUnicodes || delimiterUnicodes_,
    partialText
  };
};
```

Given that imperative and functional Feplet are nearly equivalent in 
performance, and that functional is more verbose than imperative, why choose 
functional over imperative?

Any answer to that is subjective. The package size difference is so small that 
it is not a compelling reason. Both paradigms can be criticized as being hard to 
follow. Functional because it is functional. Imperative because for-loops 
cause side-effects outside the scope of the loop, and they don't explicitly 
declare which data they mutate. Case in point:

```
_delimiterUnicodes = _delimiterUnicodes || delimiterUnicodes || delimiterUnicodes_;
```

Feplet was a great learning experience, and as such, it certainly _feels_ 
worthwhile to have adopted the functional programming paradigm. But even if we 
had to make a similar choice for a new project, and nothing new was to be 
learned, it is a great exercise in discipline to stay focused implementing a 
paradigm that best fits the needs of a project. You'll find that this pays off 
when optimizing performance, and in the course of maintaining a project. There's
also the possibility of a future project being programmed in a purely functional 
language, or strongly functional paradigm. There's no harm in being ready!

### Thanks for Visiting!

All tools used in this test (with the exception of Apple and Intel products) are 
Open Source.

Also, please check out <a href="https://github.com/electric-eloquence/feplet-vs-patternlab-php#readme" target="_blank">
Feplet vs. Pattern Lab PHP</a>, a similar benchoff.
