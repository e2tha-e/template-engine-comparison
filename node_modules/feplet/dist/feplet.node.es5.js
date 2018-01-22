'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var hogan = require('hogan.js');
var jsonEval = require('json-eval');

function spacesCount(args) {
  var count_ = args.count_,
      inc = args.inc,
      partialText_ = args.partialText_;


  var count = void 0;
  var counter = count_;

  while (/\s/.test(partialText_[counter])) {
    counter += inc;
  }

  if (inc > 0) {
    count = counter - count_;
  } else {
    count = -(counter - count_);
  }

  return {
    count: count
  };
}

function closeStartStopGet(args) {
  var parseObj = args.parseObj,
      partialText_ = args.partialText_;


  var closeStart = void 0;
  var closeSpace0Start = void 0;
  var closeSpace0Stop = void 0;
  var closeSpace1Start = void 0;
  var closeSpace1Stop = void 0;
  var closeStop = void 0;

  closeStart = parseObj.end;
  closeStop = closeStart;
  closeStop += parseObj.otag.length;
  closeStop += parseObj.tag.length;
  closeSpace0Start = closeStop;
  closeStop += spacesCount({ count_: closeStop, inc: +1, partialText_: partialText_ }).count;
  closeSpace0Stop = closeStop;
  closeStop += parseObj.n.length;
  closeSpace1Start = closeStop;
  closeStop += spacesCount({ count_: closeStop, inc: +1, partialText_: partialText_ }).count;
  closeSpace1Stop = closeStop;
  closeStop += parseObj.otag.length;

  return {
    closeStart: closeStart,
    closeSpace0Start: closeSpace0Start,
    closeSpace0Stop: closeSpace0Stop,
    closeSpace1Start: closeSpace1Start,
    closeSpace1Stop: closeSpace1Stop,
    closeStop: closeStop
  };
}

function closeTagBuild(args) {
  var closeStartStop = args.closeStartStop,
      parseObj = args.parseObj,
      partialText_ = args.partialText_;
  var closeStart = closeStartStop.closeStart,
      closeSpace0Start = closeStartStop.closeSpace0Start,
      closeSpace0Stop = closeStartStop.closeSpace0Stop,
      closeSpace1Start = closeStartStop.closeSpace1Start,
      closeSpace1Stop = closeStartStop.closeSpace1Stop,
      closeStop = closeStartStop.closeStop;

  var i = void 0;
  var partialText = '';

  i = parseObj.otag.length;

  while (i--) {
    //partialText += 'u'; // For debugging.
    partialText += '\x02';
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
    partialText += '\x03';
  }

  return {
    partialText: partialText
  };
}

function openStartStopGet(args) {
  var parseObj = args.parseObj,
      partialText_ = args.partialText_;


  var openStart = void 0;
  var openSpace0Start = void 0;
  var openSpace0Stop = void 0;
  var openSpace1Start = void 0;
  var openSpace1Stop = void 0;
  var openStop = void 0;

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
  openStart -= spacesCount({ count_: openStart, inc: -1, partialText_: partialText_ }).count;
  openSpace1Start = openStart;
  openStart -= parseObj.n.length;
  openSpace0Stop = openStart;
  openStart -= spacesCount({ count_: openStart, inc: -1, partialText_: partialText_ }).count;
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
    openStart: openStart,
    openSpace0Start: openSpace0Start,
    openSpace0Stop: openSpace0Stop,
    openSpace1Start: openSpace1Start,
    openSpace1Stop: openSpace1Stop,
    openStop: openStop
  };
}

function openTagBuild(args) {
  var openStartStop = args.openStartStop,
      parseObj = args.parseObj,
      partialText_ = args.partialText_;
  var openStart = openStartStop.openStart,
      openSpace0Start = openStartStop.openSpace0Start,
      openSpace0Stop = openStartStop.openSpace0Stop,
      openSpace1Start = openStartStop.openSpace1Start,
      openSpace1Stop = openStartStop.openSpace1Stop,
      openStop = openStartStop.openStop;

  var i = void 0;
  var partialText = '';

  i = parseObj.otag.length;

  while (i--) {
    //partialText += 'u'; // For debugging.
    partialText += '\x02';
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
    partialText += '\x03';
  }

  return {
    partialText: partialText
  };
}

function tagReplace(args) {
  var parseObj = args.parseObj,
      partialText_ = args.partialText_,
      partialShort = args.partialShort,
      paramsObj = args.paramsObj;


  var otag = parseObj.otag;
  var ctag = parseObj.ctag;

  var partialText = '';

  switch (parseObj.tag) {
    case '!':
    case '#':
    case '$':
    case '&':
    case '<':
    case '^':
    case '_v':
    case '{':

      var openStartStop = openStartStopGet({ parseObj: parseObj, partialText_: partialText_ });
      var openStart = openStartStop.openStart,
          openSpace0Start = openStartStop.openSpace0Start,
          openSpace0Stop = openStartStop.openSpace0Stop,
          openSpace1Start = openStartStop.openSpace1Start,
          openSpace1Stop = openStartStop.openSpace1Stop,
          openStop = openStartStop.openStop;


      partialText += partialText_.substring(0, openStart);
      partialText += openTagBuild({ openStartStop: openStartStop, parseObj: parseObj, partialText_: partialText_ }).partialText;

      var closeStartStop = void 0;

      switch (parseObj.tag) {
        case '#':
        case '$':
        case '&':
        case '<':
        case '^':
          closeStartStop = closeStartStopGet({ parseObj: parseObj, partialText_: partialText_ });
      }

      if (!closeStartStop) {
        partialText += partialText_.slice(openStartStop.openStop);

        break;
      }

      partialText += partialText_.substring(openStartStop.openStop, closeStartStop.closeStart);
      partialText += closeTagBuild({ closeStartStop: closeStartStop, parseObj: parseObj, partialText_: partialText_ }).partialText;
      partialText += partialText_.slice(closeStartStop.closeStop);

      break;
  }

  return {
    otag: otag,
    ctag: ctag,
    partialText: partialText
  };
}

function paramsApplyByParamKey(args) {
  var delimiters_ = args.delimiters_,
      paramKeysItr = args.paramKeysItr,
      paramKeysItrn = args.paramKeysItrn,
      elementParse = args.elementParse,
      parseObj = args.parseObj,
      parseObjKey = args.parseObjKey,
      partialText_ = args.partialText_,
      partialShort = args.partialShort,
      paramsObj = args.paramsObj;


  if (paramKeysItrn.done) {
    return {
      delimiters: delimiters_,
      partialText: partialText_
    };
  }

  var paramKey = paramKeysItrn.value;

  var delimiters = void 0;
  var otag = void 0;
  var ctag = void 0;
  var partialText = void 0;

  if (parseObjKey === 'n') {
    if (elementParse === paramKey) {
      var _tagReplace = tagReplace({
        parseObj: parseObj,
        partialText_: partialText_,
        partialShort: partialShort, // For debugging.
        paramsObj: paramsObj // For debugging.
      });

      otag = _tagReplace.otag;
      ctag = _tagReplace.ctag;
      partialText = _tagReplace.partialText;
    }
  } else if (parseObjKey === 'tag' && !delimiters_) {
    otag = parseObj.otag;
    ctag = parseObj.ctag;
  }

  if (!delimiters_ && otag && ctag) {
    delimiters = '';

    for (var i = 0, l = otag.length; i < l; i++) {
      //delimiters += 'u'; // For debugging.
      delimiters += '\x02';
    }

    delimiters += ' ';

    for (var _i = 0, _l = ctag.length; _i < _l; _i++) {
      //delimiters += 'u'; // For debugging.
      delimiters += '\x03';
    }
  }

  args.delimiters_ = delimiters || delimiters_;
  args.paramKeysItrn = paramKeysItr.next();
  args.partialText_ = partialText || partialText_;

  return paramsApplyByParamKey(args);
}

function paramsApplyToParseObj(args) {
  var delimiters_ = args.delimiters_,
      paramKeysArr = args.paramKeysArr,
      parseObj = args.parseObj,
      parseObjKeysItr = args.parseObjKeysItr,
      parseObjKeysItrn = args.parseObjKeysItrn,
      partialText_ = args.partialText_,
      partialShort = args.partialShort,
      paramsObj = args.paramsObj;


  if (parseObjKeysItrn.done) {
    return {
      delimiters: delimiters_,
      partialText: partialText_
    };
  }

  var parseObjKey = parseObjKeysItrn.value;
  var elementParse = parseObj[parseObjKey];

  var partialText = void 0;
  var delimiters = void 0;

  if (parseObjKey === 'nodes' && Array.isArray(elementParse)) {
    var elementParseItr = elementParse[Symbol.iterator]();
    var elementParseItrn = elementParseItr.next();

    var _paramsApply = paramsApply({
      paramKeysArr: paramKeysArr,
      partialParseItr: elementParseItr,
      partialParseItrn: elementParseItrn,
      partialText_: partialText_,
      partialShort: partialShort, // For debugging.
      paramsObj: paramsObj // For debugging.
    });

    delimiters = _paramsApply.delimiters;
    partialText = _paramsApply.partialText;
  } else {
    var paramKeysItr = paramKeysArr[Symbol.iterator]();
    var paramKeysItrn = paramKeysItr.next();

    var _paramsApplyByParamKe = paramsApplyByParamKey({
      delimiters_: delimiters_,
      paramKeysItr: paramKeysItr,
      paramKeysItrn: paramKeysItrn,
      elementParse: elementParse,
      parseObj: parseObj,
      parseObjKey: parseObjKey,
      partialText_: partialText_,
      partialShort: partialShort, // For debugging.
      paramsObj: paramsObj // For debugging.
    });

    delimiters = _paramsApplyByParamKe.delimiters;
    partialText = _paramsApplyByParamKe.partialText;
  }

  args.delimiters_ = delimiters || delimiters_;
  args.parseObjKeysItrn = parseObjKeysItr.next();
  args.partialText_ = partialText || partialText_;

  return paramsApplyToParseObj(args);
}

function paramsApply(args) {
  var delimiters_ = args.delimiters_,
      paramKeysArr = args.paramKeysArr,
      partialParseItr = args.partialParseItr,
      partialParseItrn = args.partialParseItrn,
      partialText_ = args.partialText_,
      partialShort = args.partialShort,
      paramsObj = args.paramsObj;


  if (partialParseItrn.done) {
    return {
      delimiters: delimiters_,
      partialText: partialText_
    };
  }

  var parseObj = partialParseItrn.value;
  var parseObjKeysItr = Object.keys(parseObj)[Symbol.iterator]();
  var parseObjKeysItrn = parseObjKeysItr.next();

  var _paramsApplyToParseOb = paramsApplyToParseObj({
    delimiters_: delimiters_,
    paramKeysArr: paramKeysArr,
    parseObj: parseObj,
    parseObjKeysItr: parseObjKeysItr,
    parseObjKeysItrn: parseObjKeysItrn,
    partialText_: partialText_,
    partialShort: partialShort, // For debugging.
    paramsObj: paramsObj // For debugging.
  }),
      delimiters = _paramsApplyToParseOb.delimiters,
      partialText = _paramsApplyToParseOb.partialText;

  args.delimiters_ = delimiters || delimiters_;
  args.partialParseItrn = partialParseItr.next();
  args.partialText_ = partialText || partialText_;

  return paramsApply(args);
}

function paramKeysWithDotNotation(args) {
  var paramKeysArr = args.paramKeysArr,
      parentObjSplit = args.parentObjSplit;


  for (var i = 0; i < parentObjSplit.length; i++) {
    var counter = i;
    var itemNext = void 0;
    var paramKey = parentObjSplit[i];

    while (itemNext = parentObjSplit[++counter]) {
      paramKey += '.' + itemNext;

      if (paramKeysArr.indexOf(paramKey) === -1) {
        paramKeysArr.push(paramKey);
      }
    }
  }

  return { paramKeysArr: paramKeysArr };
}

function paramsObjToParamKeysArr(args) {
  var paramKeysArr_ = args.paramKeysArr_,
      paramKeysShallowItr = args.paramKeysShallowItr,
      paramKeysShallowItrn = args.paramKeysShallowItrn,
      paramsObj = args.paramsObj,
      parentObjAsStr = args.parentObjAsStr,
      partialShort = args.partialShort;


  if (paramKeysShallowItrn.done) {
    return {
      paramKeysArr: paramKeysArr_
    };
  }

  var key = paramKeysShallowItrn.value;

  var paramKeysArr = paramKeysArr_;

  // paramKeysArr_ should only contain unique keys.
  if (!paramKeysArr.includes(key)) {
    paramKeysArr.push(key);
  }

  // Recurse deeper into paramsObj if this property is of type object.
  if (paramsObj[key] && _typeof(paramsObj[key]) === 'object') {
    var paramsObjNestedObj = paramsObj[key];

    // Recursion into an Array.
    if (Array.isArray(paramsObjNestedObj)) {
      for (var i = 0, l = paramsObjNestedObj.length; i < l; i++) {
        var paramsObjArrayItem = paramsObjNestedObj[i];

        if (paramsObjArrayItem && paramsObjArrayItem.constructor === Object) {
          // Clone args object for recursion deeper into paramsObj.
          var paramKeysDeeperItr = Object.keys(paramsObjArrayItem)[Symbol.iterator]();
          var paramKeysDeeperItrn = paramKeysDeeperItr.next();

          var parentObjAsStrNew = parentObjAsStr;

          if (paramKeysDeeperItrn.value) {
            parentObjAsStrNew += parentObjAsStr ? '.' + key + '.' + i : key + '.' + i;

            var parentObjSplit = parentObjAsStrNew.split('.');

            parentObjSplit.push(paramKeysDeeperItrn.value);

            var _paramKeysWithDotNota = paramKeysWithDotNotation({ paramKeysArr: paramKeysArr, parentObjSplit: parentObjSplit });

            paramKeysArr = _paramKeysWithDotNota.paramKeysArr;
          }

          var argsDeeper = {
            paramKeysArr_: paramKeysArr,
            paramKeysShallowItr: paramKeysDeeperItr,
            paramKeysShallowItrn: paramKeysDeeperItrn,
            paramsObj: paramsObjArrayItem,
            parentObjAsStr: parentObjAsStrNew,
            partialShort: args.partialShort
          };

          var _paramsObjToParamKeys = paramsObjToParamKeysArr(argsDeeper);

          paramKeysArr = _paramsObjToParamKeys.paramKeysArr;
        }
      }
    }
    // Recursion into a plain Object.
    else {
        // Clone args object for recursion deeper into paramsObj.
        var _paramKeysDeeperItr = Object.keys(paramsObjNestedObj)[Symbol.iterator]();
        var _paramKeysDeeperItrn = _paramKeysDeeperItr.next();

        var _parentObjAsStrNew = parentObjAsStr;

        if (_paramKeysDeeperItrn.value) {
          _parentObjAsStrNew += parentObjAsStr ? '.' + key : key;

          var _parentObjSplit = _parentObjAsStrNew.split('.');

          _parentObjSplit.push(_paramKeysDeeperItrn.value);

          var _paramKeysWithDotNota2 = paramKeysWithDotNotation({ paramKeysArr: paramKeysArr, parentObjSplit: _parentObjSplit });

          paramKeysArr = _paramKeysWithDotNota2.paramKeysArr;
        }

        var _argsDeeper = {
          paramKeysArr_: paramKeysArr,
          paramKeysShallowItr: _paramKeysDeeperItr,
          paramKeysShallowItrn: _paramKeysDeeperItrn,
          paramsObj: paramsObjNestedObj,
          parentObjAsStr: _parentObjAsStrNew,
          partialShort: args.partialShort
        };

        var _paramsObjToParamKeys2 = paramsObjToParamKeysArr(_argsDeeper);

        paramKeysArr = _paramsObjToParamKeys2.paramKeysArr;
      }
  } else {
    var _parentObjSplit2 = parentObjAsStr.split('.');

    _parentObjSplit2.push(key);

    var _paramKeysWithDotNota3 = paramKeysWithDotNotation({ paramKeysArr: paramKeysArr, parentObjSplit: _parentObjSplit2 });

    paramKeysArr = _paramKeysWithDotNota3.paramKeysArr;
  }

  args.paramKeysArr_ = paramKeysArr;
  args.paramKeysShallowItrn = args.paramKeysShallowItr.next();

  return paramsObjToParamKeysArr(args);
}

function styleModifierExtract(args) {
  var partialName = args.partialName;

  var styleModifierMatch = partialName.match(/\:([\w\-\|]+)/);

  var styleModifier = '';

  if (styleModifierMatch && styleModifierMatch[1]) {
    styleModifier = styleModifierMatch[1].replace(/\|/g, ' ').trim();

    if (!styleModifier) {
      styleModifierMatch = null;
    }
  }

  return {
    styleModifierMatch: styleModifierMatch,
    styleModifier: styleModifier
  };
}

var feplet = {};

Object.assign(feplet, hogan);

feplet.preprocessPartialParams = function (template, partials) {
  var generated = hogan.compile(template);

  for (var i in generated.partials) {
    if (!generated.partials.hasOwnProperty(i)) {
      continue;
    }

    var partialFull = generated.partials[i].name;

    if (partials[partialFull]) {
      continue;
    }

    var paramsMatch = partialFull.match(/\([\S\s]*\)/);

    var paramsObj = void 0;
    var partialShort = partialFull;
    var styleModifierMatch = void 0;
    var styleModifier = void 0;

    if (paramsMatch) {
      var paramsStr = paramsMatch[0];

      partialShort = partialFull.replace(paramsStr, '');

      var _styleModifierExtract = styleModifierExtract({ partialName: partialShort });

      styleModifierMatch = _styleModifierExtract.styleModifierMatch;
      styleModifier = _styleModifierExtract.styleModifier;


      if (partialFull !== partialShort) {
        try {
          paramsObj = jsonEval('{' + paramsStr.slice(1, -1).trim() + '}');
        } catch (err) {
          continue;
        }

        if (!paramsObj || paramsObj.constructor !== Object) {
          continue;
        }
      }
    } else {
      var _styleModifierExtract2 = styleModifierExtract({ partialName: partialFull });

      styleModifierMatch = _styleModifierExtract2.styleModifierMatch;
      styleModifier = _styleModifierExtract2.styleModifier;
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

    var paramKeysShallowItr = Object.keys(paramsObj)[Symbol.iterator]();
    var paramKeysShallowItrn = paramKeysShallowItr.next();

    var _paramsObjToParamKeys3 = paramsObjToParamKeysArr({
      paramKeysArr_: [],
      paramKeysShallowItr: paramKeysShallowItr,
      paramKeysShallowItrn: paramKeysShallowItrn,
      paramsObj: paramsObj,
      parentObjAsStr: '',
      partialShort: partialShort // For debugging.
    }),
        paramKeysArr = _paramsObjToParamKeys3.paramKeysArr;

    var partialText_ = partials[partialShort] || '';

    var partialScan = hogan.scan(partialText_);
    var partialParseArr = hogan.parse(partialScan);
    var partialParseItr = partialParseArr[Symbol.iterator]();
    var partialParseItrn = partialParseItr.next();

    var _paramsApply2 = paramsApply({
      paramKeysArr: paramKeysArr,
      partialParseItr: partialParseItr,
      partialParseItrn: partialParseItrn,
      partialText_: partialText_,
      partialShort: partialShort, // For debugging.
      paramsObj: paramsObj // For debugging.
    }),
        delimiters = _paramsApply2.delimiters,
        partialText = _paramsApply2.partialText;

    if (delimiters) {
      var options = { delimiters: delimiters };
      var partialScanNew = hogan.scan(partialText, delimiters);
      var partialParseArrNew = hogan.parse(partialScanNew, partialText, options);
      var partialGenerated = hogan.generate(partialParseArrNew, partialText, options);

      partials[partialFull] = partialGenerated.render(paramsObj);
    } else {
      partials[partialFull] = partialText;
    }
  }

  return {
    generated: generated,
    partials: partials
  };
};

feplet.render = function () {
  var template = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var partials_ = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var generated = void 0;
  var partials = partials_;

  Object.values(partials).forEach(function (partialText) {
    var _feplet$preprocessPar = feplet.preprocessPartialParams(partialText, partials);

    partials = _feplet$preprocessPar.partials;
  });

  var _feplet$preprocessPar2 = feplet.preprocessPartialParams(template, partials);

  generated = _feplet$preprocessPar2.generated;
  partials = _feplet$preprocessPar2.partials;


  return generated.render(context, partials);
};

if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object') {
  // Following the convention of first-letter caps for packages attached to the window object (like Hogan and Mustache)
  // but since this isn't a class, keeping it all lowercase for Node and for internal use.
  window.Feplet = feplet;
}

module.exports = feplet;
