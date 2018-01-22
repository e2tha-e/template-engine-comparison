'use strict';

const hogan = require('hogan.js');
const jsonEval = require('json-eval');

function spacesCount(args) {
  const {
    count_,
    inc,
    partialText_
  } = args;

  let count;
  let counter = count_;

  while (/\s/.test(partialText_[counter])) {
    counter += inc;
  }

  if (inc > 0) {
    count = counter - count_;
  }
  else {
    count = -(counter - count_);
  }

  return {
    count
  };
}

function closeStartStopGet(args) {
  const {
    parseObj,
    partialText_
  } = args;

  let closeStart;
  let closeSpace0Start;
  let closeSpace0Stop;
  let closeSpace1Start;
  let closeSpace1Stop;
  let closeStop;

  closeStart = parseObj.end;
  closeStop = closeStart;
  closeStop += parseObj.otag.length;
  closeStop += parseObj.tag.length;
  closeSpace0Start = closeStop;
  closeStop += spacesCount({count_: closeStop, inc: +1, partialText_}).count;
  closeSpace0Stop = closeStop;
  closeStop += parseObj.n.length;
  closeSpace1Start = closeStop;
  closeStop += spacesCount({count_: closeStop, inc: +1, partialText_}).count;
  closeSpace1Stop = closeStop;
  closeStop += parseObj.otag.length;

  return {
    closeStart,
    closeSpace0Start,
    closeSpace0Stop,
    closeSpace1Start,
    closeSpace1Stop,
    closeStop
  };
}

function closeTagBuild(args) {
  const {
    closeStartStop,
    parseObj,
    partialText_
  } = args;

  let {
    //closeStart, // For debugging.
    closeSpace0Start,
    closeSpace0Stop,
    closeSpace1Start,
    closeSpace1Stop,
    //closeStop // For debugging.
  } = closeStartStop;
  let i;
  let partialText = '';

  i = parseObj.otag.length;

  while (i--) {
    //partialText += 'u'; // For debugging.
    partialText += '\u0002';
  }

  partialText += '/';
  i = closeSpace0Start;

  while (i < closeSpace0Stop) {
    partialText += partialText_[i];
    i++;
  }

  partialText += parseObj.n;
  i = closeSpace1Start;

  while (i < closeSpace1Stop) {
    partialText += partialText_[i];
    i++;
  }

  i = parseObj.ctag.length;

  while (i--) {
    //partialText += 'u'; // For debugging.
    partialText += '\u0003';
  }

  return {
    partialText
  };
}

function openStartStopGet(args) {
  const {
    parseObj,
    partialText_
  } = args;

  let openStart;
  let openSpace0Start;
  let openSpace0Stop;
  let openSpace1Start;
  let openSpace1Stop;
  let openStop;

  openStop = parseObj.i;

  switch (parseObj.tag) {
    case '{':
      openStop++;
  }

  openStart = openStop - 1;
  openStart -= parseObj.ctag.length;

  switch (parseObj.tag) {
    case '{':
      openStart--;
  }

  openSpace1Stop = openStart;
  openStart -= spacesCount({count_: openStart, inc: -1, partialText_}).count;
  openSpace1Start = openStart;
  openStart -= parseObj.n.length;
  openSpace0Stop = openStart;
  openStart -= spacesCount({count_: openStart, inc: -1, partialText_}).count;
  openSpace0Start = openStart;

  switch (parseObj.tag) {
    case '#':
    case '&':
    case '^':
    case '{':
      openStart -= parseObj.tag.length;
  }

  openStart -= parseObj.otag.length;
  openStart++;

  return {
    openStart,
    openSpace0Start,
    openSpace0Stop,
    openSpace1Start,
    openSpace1Stop,
    openStop
  };
}

function openTagBuild(args) {
  const {
    openStartStop,
    parseObj,
    partialText_
  } = args;

  let {
    //openStart, // For debugging.
    openSpace0Start,
    openSpace0Stop,
    openSpace1Start,
    openSpace1Stop,
    //openStop // For debugging.
  } = openStartStop;
  let i;
  let partialText = '';

  i = parseObj.otag.length;

  while (i--) {
    //partialText += 'u'; // For debugging.
    partialText += '\u0002';
  }

  switch (parseObj.tag) {
    case '#':
    case '&':
    case '^':
      partialText += parseObj.tag;
      break;
    case '{':
      partialText += '&';
      break;
  }

  i = openSpace0Start;

  while (i < openSpace0Stop) {
    i++;
    partialText += partialText_[i];
  }

  partialText += parseObj.n;
  i = openSpace1Start;

  while (i < openSpace1Stop) {
    i++;
    partialText += partialText_[i];
  }

  switch (parseObj.tag) {
    case '{':
      partialText += ' ';
  }

  i = parseObj.ctag.length;

  while (i--) {
    //partialText += 'u'; // For debugging.
    partialText += '\u0003';
  }

  return {
    partialText
  };
}

function tagReplace(args) {
  const {
    parseObj,
    partialText_,
    //partialShort, // For debugging.
    //paramsObj // For debugging.
  } = args;

  const otag = parseObj.otag;
  const ctag = parseObj.ctag;

  let partialText = '';

  switch (parseObj.tag) {
    case '!':
    case '#':
    case '$':
    case '&':
    case '<':
    case '^':
    case '_v':
    case '{':

      let openStartStop = openStartStopGet({parseObj, partialText_});
      let {
        openStart,
        //openSpace0Start, // For debugging.
        //openSpace0Stop, // For debugging.
        //openSpace1Start, // For debugging.
        //openSpace1Stop, // For debugging.
        //openStop // For debugging.
      } = openStartStop;

      partialText += partialText_.substring(0, openStart);
      partialText += openTagBuild({openStartStop, parseObj, partialText_}).partialText;

      let closeStartStop;

      switch (parseObj.tag) {
        case '#':
        case '$':
        case '&':
        case '<':
        case '^':
          closeStartStop = closeStartStopGet({parseObj, partialText_});
      }

      if (!closeStartStop) {
        partialText += partialText_.slice(openStartStop.openStop);

        break;
      }

      partialText += partialText_.substring(openStartStop.openStop, closeStartStop.closeStart);
      partialText += closeTagBuild({closeStartStop, parseObj, partialText_}).partialText;
      partialText += partialText_.slice(closeStartStop.closeStop);

      break;
  }

  return {
    otag,
    ctag,
    partialText
  };
}

function paramsApplyByParamKey(args) {
  const {
    delimiters_,
    paramKeysItr,
    paramKeysItrn,
    elementParse,
    parseObj,
    parseObjKey,
    partialText_,
    partialShort, // For debugging.
    paramsObj // For debugging.
  } = args;

  if (paramKeysItrn.done) {
    return {
      delimiters: delimiters_,
      partialText: partialText_
    };
  }

  const paramKey = paramKeysItrn.value;

  let delimiters;
  let otag;
  let ctag;
  let partialText;

  if (parseObjKey === 'n') {
    if (elementParse === paramKey) {
      ({
        otag,
        ctag,
        partialText
      } = tagReplace({
        parseObj,
        partialText_,
        partialShort, // For debugging.
        paramsObj // For debugging.
      }));
    }
  }
  else if (parseObjKey === 'tag' && !delimiters_) {
    otag = parseObj.otag;
    ctag = parseObj.ctag;
  }

  if (!delimiters_ && otag && ctag) {
    delimiters = '';

    for (let i = 0, l = otag.length; i < l; i++) {
      //delimiters += 'u'; // For debugging.
      delimiters += '\u0002';
    }

    delimiters += ' ';

    for (let i = 0, l = ctag.length; i < l; i++) {
      //delimiters += 'u'; // For debugging.
      delimiters += '\u0003';
    }
  }

  args.delimiters_ = delimiters || delimiters_;
  args.paramKeysItrn = paramKeysItr.next();
  args.partialText_ = partialText || partialText_;

  return paramsApplyByParamKey(args);
}

function paramsApplyToParseObj(args) {
  const {
    delimiters_,
    paramKeysArr,
    parseObj,
    parseObjKeysItr,
    parseObjKeysItrn,
    partialText_,
    partialShort, // For debugging.
    paramsObj // For debugging.
  } = args;

  if (parseObjKeysItrn.done) {
    return {
      delimiters: delimiters_,
      partialText: partialText_
    };
  }

  const parseObjKey = parseObjKeysItrn.value;
  const elementParse = parseObj[parseObjKey];

  let partialText;
  let delimiters;

  if (parseObjKey === 'nodes' && Array.isArray(elementParse)) {
    const elementParseItr = elementParse[Symbol.iterator]();
    const elementParseItrn = elementParseItr.next();

    ({
      delimiters,
      partialText
    } = paramsApply({
      paramKeysArr,
      partialParseItr: elementParseItr,
      partialParseItrn: elementParseItrn,
      partialText_,
      partialShort, // For debugging.
      paramsObj // For debugging.
    }));
  }
  else {
    const paramKeysItr = paramKeysArr[Symbol.iterator]();
    const paramKeysItrn = paramKeysItr.next();

    ({
      delimiters,
      partialText
    } = paramsApplyByParamKey({
      delimiters_,
      paramKeysItr,
      paramKeysItrn,
      elementParse,
      parseObj,
      parseObjKey,
      partialText_,
      partialShort, // For debugging.
      paramsObj // For debugging.
    }));
  }

  args.delimiters_ = delimiters || delimiters_;
  args.parseObjKeysItrn = parseObjKeysItr.next();
  args.partialText_ = partialText || partialText_;

  return paramsApplyToParseObj(args);
}

function paramsApply(args) {
  const {
    delimiters_,
    paramKeysArr,
    partialParseItr,
    partialParseItrn,
    partialText_,
    partialShort, // For debugging.
    paramsObj // For debugging.
  } = args;

  if (partialParseItrn.done) {
    return {
      delimiters: delimiters_,
      partialText: partialText_
    };
  }

  const parseObj = partialParseItrn.value;
  const parseObjKeysItr = Object.keys(parseObj)[Symbol.iterator]();
  const parseObjKeysItrn = parseObjKeysItr.next();

  let {
    delimiters,
    partialText
  } = paramsApplyToParseObj({
    delimiters_,
    paramKeysArr,
    parseObj,
    parseObjKeysItr,
    parseObjKeysItrn,
    partialText_,
    partialShort, // For debugging.
    paramsObj // For debugging.
  });

  args.delimiters_ = delimiters || delimiters_;
  args.partialParseItrn = partialParseItr.next();
  args.partialText_ = partialText || partialText_;

  return paramsApply(args);
}

function paramKeysWithDotNotation(args) {
  const {
    paramKeysArr,
    parentObjSplit
  } = args;

  for (let i = 0; i < parentObjSplit.length; i++) {
    let counter = i;
    let itemNext;
    let paramKey = parentObjSplit[i];

    while (itemNext = parentObjSplit[++counter]) {
      paramKey += `.${itemNext}`;

      if (paramKeysArr.indexOf(paramKey) === -1) {
        paramKeysArr.push(paramKey);
      }
    }
  }

  return {paramKeysArr};
}

function paramsObjToParamKeysArr(args) {
  const {
    paramKeysArr_,
    //paramKeysShallowItr, // For debugging.
    paramKeysShallowItrn,
    paramsObj,
    parentObjAsStr,
    //partialShort // For debugging.
  } = args;

  if (paramKeysShallowItrn.done) {
    return {
      paramKeysArr: paramKeysArr_
    };
  }

  const key = paramKeysShallowItrn.value;

  let paramKeysArr = paramKeysArr_;

  // paramKeysArr_ should only contain unique keys.
  if (!paramKeysArr.includes(key)) {
    paramKeysArr.push(key);
  }

  // Recurse deeper into paramsObj if this property is of type object.
  if (paramsObj[key] && typeof paramsObj[key] === 'object') {
    const paramsObjNestedObj = paramsObj[key];

    // Recursion into an Array.
    if (Array.isArray(paramsObjNestedObj)) {
      for (let i = 0, l = paramsObjNestedObj.length; i < l; i++) {
        const paramsObjArrayItem = paramsObjNestedObj[i];

        if (paramsObjArrayItem && paramsObjArrayItem.constructor === Object) {
          // Clone args object for recursion deeper into paramsObj.
          const paramKeysDeeperItr = Object.keys(paramsObjArrayItem)[Symbol.iterator]();
          const paramKeysDeeperItrn = paramKeysDeeperItr.next();

          let parentObjAsStrNew = parentObjAsStr;

          if (paramKeysDeeperItrn.value) {
            parentObjAsStrNew += parentObjAsStr ? `.${key}.${i}` : `${key}.${i}`;

            const parentObjSplit = parentObjAsStrNew.split('.');

            parentObjSplit.push(paramKeysDeeperItrn.value);
            ({paramKeysArr} = paramKeysWithDotNotation({paramKeysArr, parentObjSplit}));
          }

          const argsDeeper = {
            paramKeysArr_: paramKeysArr,
            paramKeysShallowItr: paramKeysDeeperItr,
            paramKeysShallowItrn: paramKeysDeeperItrn,
            paramsObj: paramsObjArrayItem,
            parentObjAsStr: parentObjAsStrNew,
            partialShort: args.partialShort
          };

          ({paramKeysArr} = paramsObjToParamKeysArr(argsDeeper));
        }
      }
    }
    // Recursion into a plain Object.
    else {
      // Clone args object for recursion deeper into paramsObj.
      const paramKeysDeeperItr = Object.keys(paramsObjNestedObj)[Symbol.iterator]();
      const paramKeysDeeperItrn = paramKeysDeeperItr.next();

      let parentObjAsStrNew = parentObjAsStr;

      if (paramKeysDeeperItrn.value) {
        parentObjAsStrNew += parentObjAsStr ? `.${key}` : key;

        const parentObjSplit = parentObjAsStrNew.split('.');

        parentObjSplit.push(paramKeysDeeperItrn.value);

        ({paramKeysArr} = paramKeysWithDotNotation({paramKeysArr, parentObjSplit}));
      }

      const argsDeeper = {
        paramKeysArr_: paramKeysArr,
        paramKeysShallowItr: paramKeysDeeperItr,
        paramKeysShallowItrn: paramKeysDeeperItrn,
        paramsObj: paramsObjNestedObj,
        parentObjAsStr: parentObjAsStrNew,
        partialShort: args.partialShort
      };

      ({paramKeysArr} = paramsObjToParamKeysArr(argsDeeper));
    }
  }
  else {
    const parentObjSplit = parentObjAsStr.split('.');

    parentObjSplit.push(key);
    ({paramKeysArr} = paramKeysWithDotNotation({paramKeysArr, parentObjSplit}));
  }

  args.paramKeysArr_ = paramKeysArr;
  args.paramKeysShallowItrn = args.paramKeysShallowItr.next();

  return paramsObjToParamKeysArr(args);
}

function styleModifierExtract(args) {
  const {
    partialName
  } = args;
  let styleModifierMatch = partialName.match(/\:([\w\-\|]+)/);

  let styleModifier = '';

  if (styleModifierMatch && styleModifierMatch[1]) {
    styleModifier = styleModifierMatch[1].replace(/\|/g, ' ').trim();

    if (!styleModifier) {
      styleModifierMatch = null;
    }
  }

  return {
    styleModifierMatch,
    styleModifier
  };
}

const feplet = {};

Object.assign(feplet, hogan);

feplet.preprocessPartialParams = function (template, partials) {
  const generated = hogan.compile(template);

  for (let i in generated.partials) {
    if (!generated.partials.hasOwnProperty(i)) {
      continue;
    }

    const partialFull = generated.partials[i].name;

    if (partials[partialFull]) {
      continue;
    }

    const paramsMatch = partialFull.match(/\([\S\s]*\)/);

    let paramsObj;
    let partialShort = partialFull;
    let styleModifierMatch;
    let styleModifier;

    if (paramsMatch) {
      const paramsStr = paramsMatch[0];

      partialShort = partialFull.replace(paramsStr, '');

      ({
        styleModifierMatch,
        styleModifier
      } = styleModifierExtract({partialName: partialShort}));

      if (partialFull !== partialShort) {
        try {
          paramsObj = jsonEval(`{${paramsStr.slice(1, -1).trim()}}`);
        }
        catch (err) {
          continue;
        }

        if (!paramsObj || paramsObj.constructor !== Object) {
          continue;
        }
      }
    }
    else {
      ({
        styleModifierMatch,
        styleModifier
      } = styleModifierExtract({partialName: partialFull}));
    }

    if (styleModifierMatch) {
      partialShort = partialShort.replace(styleModifierMatch[0], '');
    }

    if (partialShort === partialFull) {
      continue;
    }

    paramsObj = paramsObj || {};

    if (styleModifier) {
      paramsObj.styleModifier = styleModifier;
    }

    const paramKeysShallowItr = Object.keys(paramsObj)[Symbol.iterator]();
    const paramKeysShallowItrn = paramKeysShallowItr.next();
    const {paramKeysArr} = paramsObjToParamKeysArr({
      paramKeysArr_: [],
      paramKeysShallowItr,
      paramKeysShallowItrn,
      paramsObj,
      parentObjAsStr: '',
      partialShort // For debugging.
    });

    let partialText_ = partials[partialShort] || '';

    const partialScan = hogan.scan(partialText_);
    const partialParseArr = hogan.parse(partialScan);
    const partialParseItr = partialParseArr[Symbol.iterator]();
    const partialParseItrn = partialParseItr.next();

    let {
      delimiters,
      partialText
    } = paramsApply({
      paramKeysArr,
      partialParseItr,
      partialParseItrn,
      partialText_,
      partialShort, // For debugging.
      paramsObj // For debugging.
    });

    if (delimiters) {
      const options = {delimiters};
      const partialScanNew = hogan.scan(partialText, delimiters);
      const partialParseArrNew = hogan.parse(partialScanNew, partialText, options);
      const partialGenerated = hogan.generate(partialParseArrNew, partialText, options);

      partials[partialFull] = partialGenerated.render(paramsObj);
    }
    else {
      partials[partialFull] = partialText;
    }
  }

  return {
    generated,
    partials
  };
};

feplet.render = function (template = '', context = {}, partials_ = {}) {
  let generated;
  let partials = partials_;

  Object.values(partials).forEach((partialText) => {
    ({
      partials
    } = feplet.preprocessPartialParams(partialText, partials));
  });

  ({
    generated,
    partials
  } = feplet.preprocessPartialParams(template, partials));

  return generated.render(context, partials);
};

if (typeof window === 'object') {
  // Following the convention of first-letter caps for packages attached to the window object (like Hogan and Mustache)
  // but since this isn't a class, keeping it all lowercase for Node and for internal use.
  window.Feplet = feplet;
}

module.exports = feplet;
