// Labeled block statements are used to segregate functions into organizational units. We could also achieve this by
// breaking this file into multiple files. However, we need to compile our code into ES5 consumable by less modern
// browsers. Given that this is a relatively small file, it is easier to keep the code in one file.
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var hogan = require('../lib/hogan.js/lib/hogan.js');

var jsonEval = require('json-eval');

var paramRegex = /\([\S\s]*\)/;

COLLECTORS: {
  var contextKeysCollect = function contextKeysCollect(args) {
    var dataKeys = args.dataKeys;

    for (var i = 0, l = dataKeys.length; i < l; i++) {
      var contextKeySplit = dataKeys[i].split('.');

      while (contextKeySplit.shift()) {
        if (contextKeySplit.length) {
          var contextKeyNew = contextKeySplit.join('.');

          if (!dataKeys.includes(contextKeyNew)) {
            dataKeys.push(contextKeyNew);
          }
        }
      }
    }

    return {
      contextKeysPart: dataKeys
    };
  };

  var dataKeysWithDotNotationAdd = function dataKeysWithDotNotationAdd(args) {
    var parentObjSplit = args.parentObjSplit;
    var dataKeysPart = [];
    var i = 0;
    var itemNext;
    var dataKey = parentObjSplit[i]; // Using assigment as the condition for a while loop to avoid having to perform conditional check for starting a for
    // loop at index 1.

    while (itemNext = parentObjSplit[++i]) {
      // eslint-disable-line no-cond-assign
      dataKey += ".".concat(itemNext);

      if (!dataKeysPart.includes(dataKey)) {
        dataKeysPart.push(dataKey);
      }
    }

    return dataKeysPart;
  };

  var dataKeysCollect = function dataKeysCollect(args) {
    var dataKeys = args.dataKeys,
        dataObj = args.dataObj,
        parentObjAsStr = args.parentObjAsStr;
    var dataKeysPart = [];
    var dataObjKeys = Object.keys(dataObj); // 0 FOR-LOOP LEVELS IN.

    for (var in0 = 0, le0 = dataObjKeys.length; in0 < le0; in0++) {
      var key = dataObjKeys[in0];

      if (!dataKeys.includes(key) && !dataKeysPart.includes(key) && !parentObjAsStr) {
        dataKeysPart.push(key);
      } // Recurse deeper into dataObj if this property is an instance of Object.


      if (dataObj[key] instanceof Object) {
        var dataObjNestedObj = dataObj[key];
        var le1 = 1;

        if (Array.isArray(dataObjNestedObj)) {
          le1 = dataObjNestedObj.length;
        } // 1 FOR-LOOP LEVELS IN.


        for (var in1 = 0; in1 < le1; in1++) {
          var parentObjAsStrNew = parentObjAsStr;
          var dataObjItem = void 0;

          if (Array.isArray(dataObjNestedObj)) {
            parentObjAsStrNew += parentObjAsStr ? ".".concat(key, ".").concat(in1) : "".concat(key, ".").concat(in1); // Recursion into an Array.

            dataObjItem = dataObjNestedObj[in1];
          } else {
            parentObjAsStrNew += parentObjAsStr ? ".".concat(key) : key; // Recursion into a plain Object.

            dataObjItem = dataObjNestedObj;
          }

          if (dataObjItem && dataObjItem.constructor === Object) {
            var dataObjItemKeys = Object.keys(dataObjItem); // 2 FOR-LOOP LEVELS IN.

            for (var in2 = 0, le2 = dataObjItemKeys.length; in2 < le2; in2++) {
              var parentObjSplit = parentObjAsStrNew.split('.');
              var dataKeysPart1 = dataKeysWithDotNotationAdd({
                dataKeys: dataKeys,
                parentObjSplit: parentObjSplit
              }); // 3 FOR-LOOP LEVELS IN.

              for (var in3 = 0, le3 = dataKeysPart1.length; in3 < le3; in3++) {
                if (!dataKeys.includes(dataKeysPart1[in3]) && !dataKeysPart.includes(dataKeysPart1[in3])) {
                  dataKeysPart.push(dataKeysPart1[in3]);
                }
              }
            } // Clone args object for recursion deeper into dataObj.


            var argsDeeper = {
              dataKeys: dataKeysPart,
              dataObj: dataObjItem,
              parentObjAsStr: parentObjAsStrNew //partialShort: args.partialShort // For debugging.

            };

            var _dataKeysCollect = dataKeysCollect(argsDeeper),
                dataKeysPart2 = _dataKeysCollect.dataKeysPart; // 2 FOR-LOOP LEVELS IN.


            for (var _in = 0, _le = dataKeysPart2.length; _in < _le; _in++) {
              if (!dataKeys.includes(dataKeysPart2[_in]) && !dataKeysPart.includes(dataKeysPart2[_in])) {
                dataKeysPart.push(dataKeysPart2[_in]);
              }
            }
          }
        }
      } else {
        var _parentObjSplit = parentObjAsStr ? parentObjAsStr.split('.') : [];

        if (!_parentObjSplit.includes(key)) {
          _parentObjSplit.push(key);
        }

        var _dataKeysPart = dataKeysWithDotNotationAdd({
          dataKeys: dataKeys,
          parentObjSplit: _parentObjSplit
        }); // 1 FOR-LOOP LEVELS IN.


        for (var _in2 = 0, _le2 = _dataKeysPart.length; _in2 < _le2; _in2++) {
          if (!dataKeys.includes(_dataKeysPart[_in2]) && !dataKeysPart.includes(_dataKeysPart[_in2])) {
            dataKeysPart.push(_dataKeysPart[_in2]);
          }
        }
      }
    }

    return {
      dataKeysPart: dataKeysPart
    };
  };
}

HELPERS: {
  var paramsObjDotNotationParse = function paramsObjDotNotationParse(args) {
    var paramsObjPart = args.paramsObjPart,
        parseObjTagName = args.parseObjTagName;
    var tagNameSplit = parseObjTagName.split('.');
    var tagName0 = tagNameSplit.shift(); // First delimit.

    var tagNameShifted = tagNameSplit.join('.'); // Rest of the dot-delimited tagName.

    var value;

    if (tagName0 in paramsObjPart) {
      var _value = paramsObjPart[tagName0];

      if (_value instanceof Object && tagNameShifted.length) {
        value = paramsObjDotNotationParse({
          paramsObjPart: _value,
          parseObjTagName: tagNameShifted
        });
      } else {
        value = _value;
      }
    }

    if (value instanceof Object) {
      return value;
    } else {
      // Ok to return null because we only need keys, not values.
      return null;
    }
  };

  var styleModifierExtract = function styleModifierExtract(args) {
    var partialName = args.partialName;
    var styleModClasses = ''; // eslint-disable-next-line no-useless-escape

    var styleModifierMatch = partialName.match(/\:([\w\-\|]+)/);

    if (styleModifierMatch && styleModifierMatch[1]) {
      styleModClasses = styleModifierMatch[1].replace(/\|/g, ' ').trim();
      /* istanbul ignore if */

      if (!styleModClasses) {
        styleModifierMatch = null;
      }
    } // Because we search and replace structured object properties to shorten the file prior to minification, we cannot
    // use "styleModifier" or other function substrings as structured object property names. "styleModifier" is also
    // reserved as a property name on paramsObj. Using "styleModClasses" instead.


    return {
      styleModClasses: styleModClasses,
      styleModifierMatch: styleModifierMatch
    };
  }; // The \u0002 and \u0003 unicodes could be replaced with variables, but it is more clear what they are and what their
  // intent is if left as unicode. They are respectively Start of Text and End of Text characters. Their purpose is to
  // be temporary alternate tag delimiters.


  TAG_REPLACER: {
    var spacesCount = function spacesCount(args) {
      var count_ = args.count_,
          inc = args.inc,
          partialText_ = args.partialText_;
      var count;
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
    };

    var openTagParse = function openTagParse(args) {
      var parseObj = args.parseObj,
          partialText_ = args.partialText_;
      var startPos;
      var space0StartPos;
      var space0StopPos;
      var space1StartPos;
      var space1StopPos;
      var stopPos;
      stopPos = parseObj.i;

      switch (parseObj.tag) {
        case '{':
          stopPos++;
      }

      startPos = stopPos - 1;
      startPos -= parseObj.ctag.length;

      switch (parseObj.tag) {
        case '{':
          startPos--;
      }

      space1StopPos = startPos;
      startPos -= spacesCount({
        count_: startPos,
        inc: -1,
        partialText_: partialText_
      }).count;
      space1StartPos = startPos;
      startPos -= parseObj.n.length;
      space0StopPos = startPos;
      startPos -= spacesCount({
        count_: startPos,
        inc: -1,
        partialText_: partialText_
      }).count;
      space0StartPos = startPos;

      switch (parseObj.tag) {
        case '#':
        case '&':
        case '^':
        case '{':
          startPos -= parseObj.tag.length;
      }

      startPos -= parseObj.otag.length;
      startPos++;
      return {
        startPos: startPos,
        space0StartPos: space0StartPos,
        space0StopPos: space0StopPos,
        space1StartPos: space1StartPos,
        space1StopPos: space1StopPos,
        stopPos: stopPos
      };
    };

    var startOfTextEncode = function startOfTextEncode(args) {
      var openTagData = args.openTagData,
          parseObj = args.parseObj,
          partialText_ = args.partialText_;
      var space0StartPos = openTagData.space0StartPos,
          space0StopPos = openTagData.space0StopPos,
          space1StartPos = openTagData.space1StartPos,
          space1StopPos = openTagData.space1StopPos;
      var i;
      var partialText = '';
      i = parseObj.otag.length;

      while (i--) {
        partialText += "\x02"; //partialText = partialText.slice(0, -1) + 'Ü'; // For debugging.
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

      i = space0StartPos;

      while (i < space0StopPos) {
        i++;
        partialText += partialText_[i];
      }

      partialText += parseObj.n;
      i = space1StartPos;

      while (i < space1StopPos) {
        i++;
        partialText += partialText_[i];
      }

      switch (parseObj.tag) {
        case '{':
          partialText += ' ';
      }

      i = parseObj.ctag.length;

      while (i--) {
        partialText += "\x03"; //partialText = partialText.slice(0, -1) + 'ü'; // For debugging.
      }

      return {
        partialText: partialText
      };
    };

    var closeTagParse = function closeTagParse(args) {
      var parseObj = args.parseObj,
          partialText_ = args.partialText_;
      var startPos;
      var space0StartPos;
      var space0StopPos;
      var space1StartPos;
      var space1StopPos;
      var stopPos;
      startPos = parseObj.end;
      stopPos = startPos;
      stopPos += parseObj.otag.length;
      stopPos += parseObj.tag.length;
      space0StartPos = stopPos;
      stopPos += spacesCount({
        count_: stopPos,
        inc: +1,
        partialText_: partialText_
      }).count;
      space0StopPos = stopPos;
      stopPos += parseObj.n.length;
      space1StartPos = stopPos;
      stopPos += spacesCount({
        count_: stopPos,
        inc: +1,
        partialText_: partialText_
      }).count;
      space1StopPos = stopPos;
      stopPos += parseObj.otag.length;
      return {
        startPos: startPos,
        space0StartPos: space0StartPos,
        space0StopPos: space0StopPos,
        space1StartPos: space1StartPos,
        space1StopPos: space1StopPos,
        stopPos: stopPos
      };
    };

    var endOfTextEncode = function endOfTextEncode(args) {
      var closeTagData = args.closeTagData,
          parseObj = args.parseObj,
          partialText_ = args.partialText_;
      var space0StartPos = closeTagData.space0StartPos,
          space0StopPos = closeTagData.space0StopPos,
          space1StartPos = closeTagData.space1StartPos,
          space1StopPos = closeTagData.space1StopPos;
      var i;
      var partialText = '';
      i = parseObj.otag.length;

      while (i--) {
        partialText += "\x02"; //partialText = partialText.slice(0, -1) + 'Ü'; // For debugging.
      }

      partialText += '/';
      i = space0StartPos;

      while (i < space0StopPos) {
        partialText += partialText_[i];
        i++;
      }

      partialText += parseObj.n;
      i = space1StartPos;

      while (i < space1StopPos) {
        partialText += partialText_[i];
        i++;
      }

      i = parseObj.ctag.length;

      while (i--) {
        partialText += "\x03"; //partialText = partialText.slice(0, -1) + 'ü'; // For debugging.
      }

      return {
        partialText: partialText
      };
    };

    var tagReplace = function tagReplace(args) {
      var parseObj = args.parseObj,
          partialText_ = args.partialText_;
      var otag = parseObj.otag;
      var ctag = parseObj.ctag;
      var partialText = '';

      switch (parseObj.tag) {
        case '#':
        case '$':
        case '&':
        case '<':
        case '^':
        case '_v':
        case '{':
          /* eslint-disable no-case-declarations */
          var openTagData = openTagParse({
            parseObj: parseObj,
            partialText_: partialText_
          });
          var startPos = openTagData.startPos;
          partialText += partialText_.substring(0, startPos);
          partialText += startOfTextEncode({
            openTagData: openTagData,
            parseObj: parseObj,
            partialText_: partialText_
          }).partialText;
          var closeTagData;
          /* eslint-enable no-case-declarations */

          switch (parseObj.tag) {
            case '#':
            case '$':
            case '&':
            case '<':
            case '^':
              closeTagData = closeTagParse({
                parseObj: parseObj,
                partialText_: partialText_
              });
          }

          if (!closeTagData) {
            partialText += partialText_.slice(openTagData.stopPos);
            break;
          }

          partialText += partialText_.substring(openTagData.stopPos, closeTagData.startPos);
          partialText += endOfTextEncode({
            closeTagData: closeTagData,
            parseObj: parseObj,
            partialText_: partialText_
          }).partialText;
          partialText += partialText_.slice(closeTagData.stopPos);
          break;
      }

      return {
        otag: otag,
        ctag: ctag,
        partialText: partialText
      };
    };
  }
}

PARAMS_APPLIER: {
  var paramsApplyByKeyArrays = function paramsApplyByKeyArrays(args) {
    var contextKeys = args.contextKeys,
        delimiterUnicodes_ = args.delimiterUnicodes_,
        tagParseVal = args.tagParseVal,
        paramKeys = args.paramKeys,
        parseObj = args.parseObj,
        parseObjKey = args.parseObjKey,
        partialText_ = args.partialText_;
    var delimiterUnicodes;
    var otag;
    var ctag;
    var partialText;

    if (parseObjKey === 'n' && (paramKeys.includes(tagParseVal) || !contextKeys.includes(tagParseVal))) {
      var _tagReplace = tagReplace({
        parseObj: parseObj,
        partialText_: partialText_
      });

      otag = _tagReplace.otag;
      ctag = _tagReplace.ctag;
      partialText = _tagReplace.partialText;
    } else if (parseObjKey === 'tag' && !delimiterUnicodes_) {
      otag = parseObj.otag;
      ctag = parseObj.ctag;
    }

    if (!delimiterUnicodes_ && otag && ctag) {
      delimiterUnicodes = '';

      for (var i = 0, l = otag.length; i < l; i++) {
        delimiterUnicodes += "\x02"; //delimiterUnicodes = delimiterUnicodes.slice(0, -1) + 'Ü'; // For debugging.
      }

      delimiterUnicodes += ' ';

      for (var _i = 0, _l = ctag.length; _i < _l; _i++) {
        delimiterUnicodes += "\x03"; //delimiterUnicodes = delimiterUnicodes.slice(0, -1) + 'ü'; // For debugging.
      }
    }

    return {
      delimiterUnicodes: delimiterUnicodes,
      partialText: partialText || partialText_
    };
  };

  var paramsApplyToParseObj = function paramsApplyToParseObj(args) {
    var contextKeys = args.contextKeys,
        delimiterUnicodes_ = args.delimiterUnicodes_,
        paramKeys = args.paramKeys,
        paramsObj = args.paramsObj,
        parseObj = args.parseObj,
        partialText_ = args.partialText_;
    var parseObjKeys = Object.keys(parseObj);

    var _delimiterUnicodes;

    var _partialText;

    for (var i = 0, l = parseObjKeys.length; i < l; i++) {
      var parseObjKey = parseObjKeys[i];
      var tagParse = parseObj[parseObjKey];
      var partialText = void 0;
      var delimiterUnicodes = void 0;

      if (parseObjKey === 'nodes' && Array.isArray(tagParse)) {
        var paramsWithDotNotation = paramsObjDotNotationParse({
          paramsObjPart: paramsObj,
          parseObjTagName: parseObj.n
        });
        var dataKeys = [];
        var paramKeysNew = void 0;
        var paramsObjNew = void 0;

        if (paramsWithDotNotation instanceof Object) {
          var _l2 = 1;

          if (Array.isArray(paramsWithDotNotation)) {
            _l2 = paramsWithDotNotation.length;
          }

          for (var _i2 = 0; _i2 < _l2; _i2++) {
            if (Array.isArray(paramsWithDotNotation)) {
              // Recursion into an Array.
              paramsObjNew = paramsWithDotNotation[_i2];
            } else {
              // Recursion into a plain Object.
              paramsObjNew = paramsWithDotNotation;
            }

            var paramsObjKeys = Object.keys(paramsObjNew);

            if (paramsObjKeys.length) {
              var _dataKeysCollect2 = dataKeysCollect({
                dataKeys: [],
                dataObj: paramsObjNew,
                parentObjAsStr: '' //partialShort // For debugging.

              });

              dataKeys = _dataKeysCollect2.dataKeysPart;
            }
          }

          paramKeysNew = paramKeys.concat(dataKeys);
        } else {
          paramKeysNew = paramKeys;
          paramsObjNew = paramsObj;
        }

        var _paramsApply = paramsApply({
          // eslint-disable-line no-use-before-define
          contextKeys: contextKeys,
          delimiterUnicodes_: delimiterUnicodes_,
          paramKeys: paramKeysNew,
          paramsObj: paramsObjNew,
          partialParseArr: tagParse,
          //partialShort, // For debugging.
          partialText_: _partialText || partialText_
        });

        delimiterUnicodes = _paramsApply.delimiterUnicodes;
        partialText = _paramsApply.partialText;
      } else {
        var _paramsApplyByKeyArra = paramsApplyByKeyArrays({
          contextKeys: contextKeys,
          delimiterUnicodes_: delimiterUnicodes_,
          tagParseVal: tagParse,
          paramKeys: paramKeys,
          //paramsObj, // For debugging.
          parseObj: parseObj,
          parseObjKey: parseObjKey,
          //partialShort, // For debugging.
          partialText_: _partialText || partialText_
        });

        delimiterUnicodes = _paramsApplyByKeyArra.delimiterUnicodes;
        partialText = _paramsApplyByKeyArra.partialText;
      }

      _delimiterUnicodes = _delimiterUnicodes || delimiterUnicodes || delimiterUnicodes_;
      _partialText = partialText;
    }

    return {
      delimiterUnicodes: _delimiterUnicodes,
      partialText: _partialText
    };
  };

  var paramsApply = function paramsApply(args) {
    var contextKeys = args.contextKeys,
        delimiterUnicodes_ = args.delimiterUnicodes_,
        paramKeys = args.paramKeys,
        paramsObj = args.paramsObj,
        partialParseArr = args.partialParseArr,
        partialText_ = args.partialText_;

    var _delimiterUnicodes;

    var partialText;

    for (var i = 0, l = partialParseArr.length; i < l; i++) {
      var parseObj = partialParseArr[i];
      var delimiterUnicodes = void 0;

      var _paramsApplyToParseOb = paramsApplyToParseObj({
        contextKeys: contextKeys,
        delimiterUnicodes_: delimiterUnicodes_,
        paramKeys: paramKeys,
        paramsObj: paramsObj,
        parseObj: parseObj,
        //partialShort, // For debugging.
        partialText_: partialText || partialText_
      });

      delimiterUnicodes = _paramsApplyToParseOb.delimiterUnicodes;
      partialText = _paramsApplyToParseOb.partialText;
      _delimiterUnicodes = _delimiterUnicodes || delimiterUnicodes || delimiterUnicodes_;
    }

    return {
      delimiterUnicodes: _delimiterUnicodes,
      partialText: partialText || partialText_
    };
  };

  var partialsWithParamsAdd = function partialsWithParamsAdd(args) {
    var compilation = args.compilation,
        contextKeys = args.contextKeys,
        partialsKeys = args.partialsKeys,
        partials = args.partials,
        partialsComp = args.partialsComp,
        options = args.options;

    for (var i = 0, l = partialsKeys.length; i < l; i++) {
      var partialKey = partialsKeys[i];
      var partialFull = compilation.partials[partialKey].name;
      var styleModClasses = void 0;
      var styleModifierMatch = void 0;

      if (partials[partialFull]) {
        continue;
      }

      var paramsMatch = partialFull.match(paramRegex);
      var paramsObj = {};
      var partialShort = partialFull;

      if (paramsMatch) {
        var paramsStr = paramsMatch[0];
        partialShort = partialFull.replace(paramsStr, '');

        var _styleModifierExtract = styleModifierExtract({
          partialName: partialShort
        });

        styleModClasses = _styleModifierExtract.styleModClasses;
        styleModifierMatch = _styleModifierExtract.styleModifierMatch;

        if (partialFull !== partialShort) {
          try {
            paramsObj = jsonEval("{".concat(paramsStr.slice(1, -1).trim(), "}"));
          } catch (err) {
            /* istanbul ignore next */
            console.error(err); // eslint-disable-line no-console

            /* istanbul ignore next */

            continue;
          }
          /* istanbul ignore if */


          if (!paramsObj || paramsObj.constructor !== Object) {
            continue;
          }
        }
      } else {
        var _styleModifierExtract2 = styleModifierExtract({
          partialName: partialFull
        });

        styleModClasses = _styleModifierExtract2.styleModClasses;
        styleModifierMatch = _styleModifierExtract2.styleModifierMatch;
      }

      if (styleModifierMatch) {
        partialShort = partialShort.replace(styleModifierMatch[0], '');
      }
      /* istanbul ignore if */


      if (partialShort === partialFull || !partials[partialShort]) {
        continue;
      }

      if (styleModClasses) {
        paramsObj.styleModifier = styleModClasses;
      }

      var paramsObjKeys = Object.keys(paramsObj);
      var dataKeys = void 0;

      if (paramsObjKeys.length) {
        var _dataKeysCollect3 = dataKeysCollect({
          dataKeys: [],
          dataObj: paramsObj,
          parentObjAsStr: '' //partialShort // For debugging.

        });

        dataKeys = _dataKeysCollect3.dataKeysPart;
      }

      var paramKeys = dataKeys;
      var partialText_ = partials[partialShort] || '';
      var delimiterUnicodes = void 0;
      var partialParseArr = [];
      var partialText = '';

      if (partialsComp[partialShort].parseArr) {
        partialParseArr = partialsComp[partialShort].parseArr;
      } // DEPRECATED.
      // TODO: This accommodates old usage of partialsComp. To be removed.
      else {
          partialParseArr = hogan.parse(hogan.scan(partials[partialShort], options.delimiters), partials[partialShort], options);
          partialsComp[partialShort] = {
            parseArr: partialParseArr,
            compilation: partialsComp[partialShort]
          };
        }

      var _paramsApply2 = paramsApply({
        contextKeys: contextKeys,
        paramKeys: paramKeys,
        paramsObj: paramsObj,
        partialParseArr: partialParseArr,
        //partialShort, // For debugging.
        partialText_: partialText_
      });

      delimiterUnicodes = _paramsApply2.delimiterUnicodes;
      partialText = _paramsApply2.partialText;

      if (delimiterUnicodes && partialText !== partialText_) {
        // First, render with unicode delimiters.
        var optionsWithUnicodes = Object.assign({
          delimiters: delimiterUnicodes
        }, options);
        var compilationWithUnicodes = hogan.generate(hogan.parse(hogan.scan(partialText, delimiterUnicodes), partialText, optionsWithUnicodes), partialText, optionsWithUnicodes);
        partials[partialFull] = compilationWithUnicodes.render(paramsObj); // Then, write to partialsComp with previous render as partial text and with regular delimiters and options.

        var parseArr = hogan.parse(hogan.scan(partials[partialFull], options.delimiters), partials[partialFull], options);
        partialsComp[partialFull] = {
          parseArr: parseArr,
          compilation: hogan.generate(parseArr, partials[partialFull], options)
        };
      }
    }

    return {
      partials: partials,
      partialsComp: partialsComp
    };
  };
} // The exposed methods are object-oriented in methodology. When invoked as object instance methods, they may mutate
// instance data in a way hidden from outside the method. Invoking functions may similarly not directly depend on the
// returned data.


METHODS: {
  var preProcessContextKeys = function preProcessContextKeys(context) {
    /* istanbul ignore if */
    if (!context) {
      return [];
    }

    var _dataKeysCollect4 = dataKeysCollect({
      dataKeys: [],
      dataObj: context,
      parentObjAsStr: ''
    }),
        dataKeys = _dataKeysCollect4.dataKeysPart;

    var contextKeysPart = [];

    if (dataKeys.length) {
      var _contextKeysCollect = contextKeysCollect({
        dataKeys: dataKeys
      });

      contextKeysPart = _contextKeysCollect.contextKeysPart;
    }

    return contextKeysPart;
  };

  var preProcessPartialParams = function preProcessPartialParams(text, compilation_, partials_, partialsComp_, contextKeys_, context, options_) {
    var options = options_ || this.options || {};
    var compilation = compilation_ || hogan.compile(text, options);
    var partialsKeys = Object.keys(compilation.partials);
    var contextKeys = contextKeys_ || this && this.contextKeys;

    var _contextKeys; // First, check if we still need to preprocess contextKeys because .render() was called statically.


    if (typeof contextKeys === 'undefined') {
      var hasParam = false;

      for (var i = 0, l = partialsKeys.length; i < l; i++) {
        var partialFull = compilation.partials[partialsKeys[i]].name;
        hasParam = paramRegex.test(partialFull) || partialFull.includes(':');

        if (hasParam) {
          break;
        }
      }

      if (hasParam) {
        contextKeys = _contextKeys = preProcessContextKeys(context);
      } else {
        contextKeys = [];
      }
    }

    var partials = partials_ || this.partials || {};
    var partialsComp = partialsComp_ || this.partialsComp || {};

    if (partialsKeys.length) {
      var _partialsWithParamsAd = partialsWithParamsAdd({
        compilation: compilation,
        contextKeys: contextKeys,
        partialsKeys: partialsKeys,
        partials: partials,
        partialsComp: partialsComp,
        options: options
      });

      partials = _partialsWithParamsAd.partials;
      partialsComp = _partialsWithParamsAd.partialsComp;
    }

    return {
      compilation: compilation,
      _contextKeys: _contextKeys,
      // Only defined if hasParam.
      partials: partials,
      partialsComp: partialsComp
    };
  };

  var compile = function compile(text, options_, partials_, partialsComp_, contextKeys_, context) {
    var options = options_ || this.options || {};
    var compilation = hogan.compile(text, options);
    var contextKeys = contextKeys_ || this && this.contextKeys;

    var _contextKeys;

    var partials = partials_ || this.partials || {};
    var partialsComp = partialsComp_ || this.partialsComp || {};
    var partialsKeys = Object.keys(partials);

    for (var i = 0, l = partialsKeys.length; i < l; i++) {
      var partialKey = partialsKeys[i]; // DEPRECATED.
      // TODO: This accommodates old usage of partialsComp. To be removed.

      if (!partialsComp[partialKey].compilation) {
        var parseArr = hogan.parse(hogan.scan(partials[partialKey], options.delimiters), partials[partialKey], options);
        partialsComp[partialKey] = {
          parseArr: parseArr,
          compilation: partialsComp[partialKey]
        };
      }

      var _preProcessPartialPar = preProcessPartialParams(partials[partialKey], partialsComp[partialKey].compilation, partials, partialsComp, contextKeys, context, options);

      _contextKeys = _preProcessPartialPar._contextKeys;
      partials = _preProcessPartialPar.partials;
      partialsComp = _preProcessPartialPar.partialsComp;
    }

    if (_contextKeys) {
      contextKeys = _contextKeys;
    }

    var _preProcessPartialPar2 = preProcessPartialParams(text, compilation, partials, partialsComp, contextKeys, context, options);

    compilation = _preProcessPartialPar2.compilation;
    return compilation;
  };

  var registerPartial = function registerPartial(partialName, partialTemplate, partialCom, partials_, partialsComp_, options_) {
    var partials = partials_ || this.partials || {};
    var partialsComp = partialsComp_ || this.partialsComp || {};
    var options = options_ || this.options || {};

    if (!partials[partialName]) {
      partials[partialName] = partialTemplate;
    }

    if (!partialsComp[partialName]) {
      if (partialCom) {
        partialsComp[partialName] = partialCom;
      } else {
        var parseArr = hogan.parse(hogan.scan(partialTemplate, options.delimiters));
        partialsComp[partialName] = {
          parseArr: parseArr,
          compilation: hogan.generate(parseArr, partialTemplate, options)
        };
      }
    }

    return {
      partials: partials,
      partialsComp: partialsComp
    };
  };

  var render = function render() {
    var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var context_ = arguments.length > 1 ? arguments[1] : undefined;
    var partials_ = arguments.length > 2 ? arguments[2] : undefined;
    var partialsComp_ = arguments.length > 3 ? arguments[3] : undefined;
    var contextKeys_ = arguments.length > 4 ? arguments[4] : undefined;
    var options_ = arguments.length > 5 ? arguments[5] : undefined;
    var context = context_ || this.context || {};
    var contextKeys = contextKeys_ || this && this.contextKeys;
    var options = options_ || this.options || {};
    var partials = partials_ || this.partials || {};
    var partialsComp = partialsComp_ || this.partialsComp || {};
    var partialsKeys = Object.keys(partials);

    for (var i = 0, l = partialsKeys.length; i < l; i++) {
      var partialKey = partialsKeys[i];
      var partialsPart = void 0;
      var partialsCompPart = void 0;

      if (!partialsComp[partialKey]) {
        var _registerPartial = registerPartial(partialKey, partials[partialKey], null, partials, partialsComp, options);

        partialsPart = _registerPartial.partialsPart;
        partialsCompPart = _registerPartial.partialsCompPart;
        Object.assign(partialsComp, partialsCompPart);

        if (!partials[partialKey]) {
          Object.assign(partials, partialsPart);
        }
      }
    }

    var compilation;

    if (Object.keys(partialsComp).length) {
      compilation = compile(text, options, partials, partialsComp, contextKeys, context);
    } else {
      compilation = hogan.compile(text, options);
    }

    return compilation.render(context, partials, null, partialsComp);
  };

  var unregisterPartial = function unregisterPartial(partialKey, partials_, partialsComp_) {
    var partials = partials_ || this.partials || {};
    var partialsComp = partialsComp_ || this.partialsComp || {};
    delete partials[partialKey];
    delete partialsComp[partialKey];
    return {
      partials: partials,
      partialsComp: partialsComp
    };
  };
} // PREPARE FOR EXPORT.


function Feplet(context, partials, partialsComp, contextKeys, options) {
  this.context = context || {};
  this.partials = partials || {};
  this.partialsComp = partialsComp || {};
  this.contextKeys = contextKeys || preProcessContextKeys(this.context);
  this.options = options || {};
} // STATIC METHODS.


Object.assign(Feplet, hogan); // hogan is not a class so the constructor does not get overridden.

Feplet.compile = compile;
Feplet.preProcessContextKeys = preProcessContextKeys;
Feplet.preProcessPartialParams = preProcessPartialParams;
Feplet.registerPartial = registerPartial;
Feplet.render = render;
Feplet.unregisterPartial = unregisterPartial; // INSTANCE METHODS.

Feplet.prototype.compile = compile;
Feplet.prototype.preProcessPartialParams = preProcessPartialParams;
Feplet.prototype.registerPartial = registerPartial;
Feplet.prototype.render = render;
Feplet.prototype.unregisterPartial = unregisterPartial;

if (typeof define === 'function') {
  define(function () {
    return Feplet;
  });
}
/* istanbul ignore next */
else if ((typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object') {
    window.Feplet = Feplet;
  }

module.exports = Feplet;
