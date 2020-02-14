// Labeled block statements are used to segregate functions into organizational units. We could also achieve this by
// breaking this file into multiple files. However, we need to compile our code into ES5 consumable by less modern
// browsers. Given that this is a relatively small file, it is easier to keep the code in one file.

'use strict';

const hogan = require('../lib/hogan.js/lib/hogan.js');
const jsonEval = require('json-eval');

const paramRegex = /\([\S\s]*\)/;

COLLECTORS: {
  var contextKeysCollect = function (args) {
    const {
      dataKeys
    } = args;

    for (let i = 0, l = dataKeys.length; i < l; i++) {
      const contextKeySplit = dataKeys[i].split('.');

      while (contextKeySplit.shift()) {
        if (contextKeySplit.length) {
          const contextKeyNew = contextKeySplit.join('.');

          if (!dataKeys.includes(contextKeyNew)) {
            dataKeys.push(contextKeyNew);
          }
        }
      }
    }

    return {contextKeysPart: dataKeys};
  };

  var dataKeysWithDotNotationAdd = function (args) {
    const {
      parentObjSplit
    } = args;

    const dataKeysPart = [];
    let i = 0;
    let itemNext;
    let dataKey = parentObjSplit[i];

    // Using assigment as the condition for a while loop to avoid having to perform conditional check for starting a for
    // loop at index 1.
    while (itemNext = parentObjSplit[++i]) { // eslint-disable-line no-cond-assign
      dataKey += `.${itemNext}`;

      if (!dataKeysPart.includes(dataKey)) {
        dataKeysPart.push(dataKey);
      }
    }

    return dataKeysPart;
  };

  var dataKeysCollect = function (args) {
    const {
      dataKeys,
      dataObj,
      parentObjAsStr,
      //partialShort // For debugging.
    } = args;

    const dataKeysPart = [];
    const dataObjKeys = Object.keys(dataObj);

    // 0 FOR-LOOP LEVELS IN.
    for (let in0 = 0, le0 = dataObjKeys.length; in0 < le0; in0++) {
      const key = dataObjKeys[in0];

      if (!dataKeys.includes(key) && !dataKeysPart.includes(key) && !parentObjAsStr) {
        dataKeysPart.push(key);
      }

      // Recurse deeper into dataObj if this property is an instance of Object.
      if (dataObj[key] instanceof Object) {
        const dataObjNestedObj = dataObj[key];
        let le1 = 1;

        if (Array.isArray(dataObjNestedObj)) {
          le1 = dataObjNestedObj.length;
        }

        // 1 FOR-LOOP LEVELS IN.
        for (let in1 = 0; in1 < le1; in1++) {
          let parentObjAsStrNew = parentObjAsStr;
          let dataObjItem;

          if (Array.isArray(dataObjNestedObj)) {
            parentObjAsStrNew += parentObjAsStr ? `.${key}.${in1}` : `${key}.${in1}`;
            // Recursion into an Array.
            dataObjItem = dataObjNestedObj[in1];
          }
          else {
            parentObjAsStrNew += parentObjAsStr ? `.${key}` : key;
            // Recursion into a plain Object.
            dataObjItem = dataObjNestedObj;
          }

          if (dataObjItem && dataObjItem.constructor === Object) {
            const dataObjItemKeys = Object.keys(dataObjItem);

            // 2 FOR-LOOP LEVELS IN.
            for (let in2 = 0, le2 = dataObjItemKeys.length; in2 < le2; in2++) {
              const parentObjSplit = parentObjAsStrNew.split('.');
              const dataKeysPart1 = dataKeysWithDotNotationAdd({dataKeys, parentObjSplit});

              // 3 FOR-LOOP LEVELS IN.
              for (let in3 = 0, le3 = dataKeysPart1.length; in3 < le3; in3++) {
                if (!dataKeys.includes(dataKeysPart1[in3]) && !dataKeysPart.includes(dataKeysPart1[in3])) {
                  dataKeysPart.push(dataKeysPart1[in3]);
                }
              }
            }

            // Clone args object for recursion deeper into dataObj.
            const argsDeeper = {
              dataKeys: dataKeysPart,
              dataObj: dataObjItem,
              parentObjAsStr: parentObjAsStrNew,
              //partialShort: args.partialShort // For debugging.
            };

            const {dataKeysPart: dataKeysPart2} = dataKeysCollect(argsDeeper);

            // 2 FOR-LOOP LEVELS IN.
            for (let in2 = 0, le2 = dataKeysPart2.length; in2 < le2; in2++) {
              if (!dataKeys.includes(dataKeysPart2[in2]) && !dataKeysPart.includes(dataKeysPart2[in2])) {
                dataKeysPart.push(dataKeysPart2[in2]);
              }
            }
          }
        }
      }
      else {
        const parentObjSplit = parentObjAsStr ? parentObjAsStr.split('.') : [];

        if (!parentObjSplit.includes(key)) {
          parentObjSplit.push(key);
        }

        const dataKeysPart1 = dataKeysWithDotNotationAdd({dataKeys, parentObjSplit});

        // 1 FOR-LOOP LEVELS IN.
        for (let in1 = 0, le1 = dataKeysPart1.length; in1 < le1; in1++) {
          if (!dataKeys.includes(dataKeysPart1[in1]) && !dataKeysPart.includes(dataKeysPart1[in1])) {
            dataKeysPart.push(dataKeysPart1[in1]);
          }
        }
      }
    }

    return {dataKeysPart};
  };
}

HELPERS: {
  var paramsObjDotNotationParse = function (args) {
    const {
      paramsObjPart,
      parseObjTagName
    } = args;

    const tagNameSplit = parseObjTagName.split('.');
    const tagName0 = tagNameSplit.shift(); // First delimit.
    const tagNameShifted = tagNameSplit.join('.'); // Rest of the dot-delimited tagName.
    let value;

    if (tagName0 in paramsObjPart) {
      const _value = paramsObjPart[tagName0];

      if (_value instanceof Object && tagNameShifted.length) {
        value = paramsObjDotNotationParse({
          paramsObjPart: _value,
          parseObjTagName: tagNameShifted
        });
      }
      else {
        value = _value;
      }
    }

    if (value instanceof Object) {
      return value;
    }
    else {
      // Ok to return null because we only need keys, not values.
      return null;
    }
  };

  var styleModifierExtract = function (args) {
    const {
      partialName
    } = args;

    let styleModClasses = '';
    // eslint-disable-next-line no-useless-escape
    let styleModifierMatch = partialName.match(/\:([\w\-\|]+)/);

    if (styleModifierMatch && styleModifierMatch[1]) {
      styleModClasses = styleModifierMatch[1].replace(/\|/g, ' ').trim();

      /* istanbul ignore if */
      if (!styleModClasses) {
        styleModifierMatch = null;
      }
    }

    // Because we search and replace structured object properties to shorten the file prior to minification, we cannot
    // use "styleModifier" or other function substrings as structured object property names. "styleModifier" is also
    // reserved as a property name on paramsObj. Using "styleModClasses" instead.
    return {
      styleModClasses,
      styleModifierMatch
    };
  };

  // The \u0002 and \u0003 unicodes could be replaced with variables, but it is more clear what they are and what their
  // intent is if left as unicode. They are respectively Start of Text and End of Text characters. Their purpose is to
  // be temporary alternate tag delimiters.

  TAG_REPLACER: {
    var spacesCount = function (args) {
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
    };

    var openTagParse = function (args) {
      const {
        parseObj,
        partialText_
      } = args;

      let startPos;
      let space0StartPos;
      let space0StopPos;
      let space1StartPos;
      let space1StopPos;
      let stopPos;

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
      startPos -= spacesCount({count_: startPos, inc: -1, partialText_}).count;
      space1StartPos = startPos;
      startPos -= parseObj.n.length;
      space0StopPos = startPos;
      startPos -= spacesCount({count_: startPos, inc: -1, partialText_}).count;
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
        startPos,
        space0StartPos,
        space0StopPos,
        space1StartPos,
        space1StopPos,
        stopPos
      };
    };

    var startOfTextEncode = function (args) {
      const {
        openTagData,
        parseObj,
        partialText_
      } = args;

      let {
        //startPos, // For debugging.
        space0StartPos,
        space0StopPos,
        space1StartPos,
        space1StopPos,
        //stopPos // For debugging.
      } = openTagData;
      let i;
      let partialText = '';

      i = parseObj.otag.length;

      while (i--) {
        partialText += '\u0002';
        //partialText = partialText.slice(0, -1) + 'Ü'; // For debugging.
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
        partialText += '\u0003';
        //partialText = partialText.slice(0, -1) + 'ü'; // For debugging.
      }

      return {
        partialText
      };
    };

    var closeTagParse = function (args) {
      const {
        parseObj,
        partialText_
      } = args;

      let startPos;
      let space0StartPos;
      let space0StopPos;
      let space1StartPos;
      let space1StopPos;
      let stopPos;

      startPos = parseObj.end;
      stopPos = startPos;
      stopPos += parseObj.otag.length;
      stopPos += parseObj.tag.length;
      space0StartPos = stopPos;
      stopPos += spacesCount({count_: stopPos, inc: +1, partialText_}).count;
      space0StopPos = stopPos;
      stopPos += parseObj.n.length;
      space1StartPos = stopPos;
      stopPos += spacesCount({count_: stopPos, inc: +1, partialText_}).count;
      space1StopPos = stopPos;
      stopPos += parseObj.otag.length;

      return {
        startPos,
        space0StartPos,
        space0StopPos,
        space1StartPos,
        space1StopPos,
        stopPos
      };
    };

    var endOfTextEncode = function (args) {
      const {
        closeTagData,
        parseObj,
        partialText_
      } = args;

      let {
        //startPos, // For debugging.
        space0StartPos,
        space0StopPos,
        space1StartPos,
        space1StopPos,
        //stopPos // For debugging.
      } = closeTagData;
      let i;
      let partialText = '';

      i = parseObj.otag.length;

      while (i--) {
        partialText += '\u0002';
        //partialText = partialText.slice(0, -1) + 'Ü'; // For debugging.
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
        partialText += '\u0003';
        //partialText = partialText.slice(0, -1) + 'ü'; // For debugging.
      }

      return {
        partialText
      };
    };

    var tagReplace = function (args) {
      const {
        parseObj,
        partialText_
      } = args;

      const otag = parseObj.otag;
      const ctag = parseObj.ctag;
      let partialText = '';

      switch (parseObj.tag) {
        case '#':
        case '$':
        case '&':
        case '<':
        case '^':
        case '_v':
        case '{':

          /* eslint-disable no-case-declarations */
          let openTagData = openTagParse({parseObj, partialText_});
          let {
            startPos,
            //space0StartPos, // For debugging.
            //space0StopPos, // For debugging.
            //space1StartPos, // For debugging.
            //space1StopPos, // For debugging.
            //stopPos // For debugging.
          } = openTagData;

          partialText += partialText_.substring(0, startPos);
          partialText += startOfTextEncode({openTagData, parseObj, partialText_}).partialText;

          let closeTagData;
          /* eslint-enable no-case-declarations */

          switch (parseObj.tag) {
            case '#':
            case '$':
            case '&':
            case '<':
            case '^':
              closeTagData = closeTagParse({parseObj, partialText_});
          }

          if (!closeTagData) {
            partialText += partialText_.slice(openTagData.stopPos);

            break;
          }

          partialText += partialText_.substring(openTagData.stopPos, closeTagData.startPos);
          partialText += endOfTextEncode({closeTagData, parseObj, partialText_}).partialText;
          partialText += partialText_.slice(closeTagData.stopPos);

          break;
      }

      return {
        otag,
        ctag,
        partialText
      };
    };
  }
}

PARAMS_APPLIER: {
  var paramsApplyByKeyArrays = function (args) {
    const {
      contextKeys,
      delimiterUnicodes_,
      tagParseVal,
      paramKeys,
      //paramsObj, // For debugging.
      parseObj,
      parseObjKey,
      //partialShort, // For debugging.
      partialText_
    } = args;

    let delimiterUnicodes;
    let otag;
    let ctag;
    let partialText;

    if (parseObjKey === 'n' && (paramKeys.includes(tagParseVal) || !contextKeys.includes(tagParseVal))) {
      ({
        otag,
        ctag,
        partialText
      } = tagReplace({
        parseObj,
        partialText_
      }));
    }
    else if (parseObjKey === 'tag' && !delimiterUnicodes_) {
      otag = parseObj.otag;
      ctag = parseObj.ctag;
    }

    if (!delimiterUnicodes_ && otag && ctag) {
      delimiterUnicodes = '';

      for (let i = 0, l = otag.length; i < l; i++) {
        delimiterUnicodes += '\u0002';
        //delimiterUnicodes = delimiterUnicodes.slice(0, -1) + 'Ü'; // For debugging.
      }

      delimiterUnicodes += ' ';

      for (let i = 0, l = ctag.length; i < l; i++) {
        delimiterUnicodes += '\u0003';
        //delimiterUnicodes = delimiterUnicodes.slice(0, -1) + 'ü'; // For debugging.
      }
    }

    return {
      delimiterUnicodes,
      partialText: partialText || partialText_
    };
  };

  var paramsApplyToParseObj = function (args) {
    const {
      contextKeys,
      delimiterUnicodes_,
      paramKeys,
      paramsObj,
      parseObj,
      //partialShort, // For debugging.
      partialText_
    } = args;

    const parseObjKeys = Object.keys(parseObj);
    let _delimiterUnicodes;
    let _partialText;

    for (let i = 0, l = parseObjKeys.length; i < l; i++) {
      const parseObjKey = parseObjKeys[i];
      const tagParse = parseObj[parseObjKey];
      let partialText;
      let delimiterUnicodes;

      if (parseObjKey === 'nodes' && Array.isArray(tagParse)) {
        const paramsWithDotNotation = paramsObjDotNotationParse({
          paramsObjPart: paramsObj,
          parseObjTagName: parseObj.n
        });

        let dataKeys = [];
        let paramKeysNew;
        let paramsObjNew;

        if (paramsWithDotNotation instanceof Object) {
          let l = 1;

          if (Array.isArray(paramsWithDotNotation)) {
            l = paramsWithDotNotation.length;
          }

          for (let i = 0; i < l; i++) {
            if (Array.isArray(paramsWithDotNotation)) {
              // Recursion into an Array.
              paramsObjNew = paramsWithDotNotation[i];
            }
            else {
              // Recursion into a plain Object.
              paramsObjNew = paramsWithDotNotation;
            }

            const paramsObjKeys = Object.keys(paramsObjNew);

            if (paramsObjKeys.length) {
              ({dataKeysPart: dataKeys} = dataKeysCollect({
                dataKeys: [],
                dataObj: paramsObjNew,
                parentObjAsStr: '',
                //partialShort // For debugging.
              }));
            }
          }

          paramKeysNew = paramKeys.concat(dataKeys);
        }
        else {
          paramKeysNew = paramKeys;
          paramsObjNew = paramsObj;
        }

        ({
          delimiterUnicodes,
          partialText
        } = paramsApply({ // eslint-disable-line no-use-before-define
          contextKeys,
          delimiterUnicodes_,
          paramKeys: paramKeysNew,
          paramsObj: paramsObjNew,
          partialParseArr: tagParse,
          //partialShort, // For debugging.
          partialText_: _partialText || partialText_
        }));
      }
      else {
        ({
          delimiterUnicodes,
          partialText
        } = paramsApplyByKeyArrays({
          contextKeys,
          delimiterUnicodes_,
          tagParseVal: tagParse,
          paramKeys,
          //paramsObj, // For debugging.
          parseObj,
          parseObjKey,
          //partialShort, // For debugging.
          partialText_: _partialText || partialText_
        }));
      }

      _delimiterUnicodes = _delimiterUnicodes || delimiterUnicodes || delimiterUnicodes_;
      _partialText = partialText;
    }

    return {
      delimiterUnicodes: _delimiterUnicodes,
      partialText: _partialText
    };
  };

  var paramsApply = function (args) {
    const {
      contextKeys,
      delimiterUnicodes_,
      paramKeys,
      paramsObj,
      partialParseArr,
      //partialShort, // For debugging.
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
        //partialShort, // For debugging.
        partialText_: partialText || partialText_
      }));

      _delimiterUnicodes = _delimiterUnicodes || delimiterUnicodes || delimiterUnicodes_;
    }

    return {
      delimiterUnicodes: _delimiterUnicodes,
      partialText: partialText || partialText_
    };
  };

  var partialsWithParamsAdd = function (args) {
    const {
      compilation,
      contextKeys,
      partialsKeys,
      partials,
      partialsComp,
      options
    } = args;

    for (let i = 0, l = partialsKeys.length; i < l; i++) {
      const partialKey = partialsKeys[i];
      const partialFull = compilation.partials[partialKey].name;
      let styleModClasses;
      let styleModifierMatch;

      if (partials[partialFull]) {
        continue;
      }

      const paramsMatch = partialFull.match(paramRegex);
      let paramsObj = {};
      let partialShort = partialFull;

      if (paramsMatch) {
        const paramsStr = paramsMatch[0];

        partialShort = partialFull.replace(paramsStr, '');

        ({
          styleModClasses,
          styleModifierMatch
        } = styleModifierExtract({partialName: partialShort}));

        if (partialFull !== partialShort) {
          try {
            paramsObj = jsonEval(`{${paramsStr.slice(1, -1).trim()}}`);
          }
          catch (err) {
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
      }
      else {
        ({
          styleModClasses,
          styleModifierMatch
        } = styleModifierExtract({partialName: partialFull}));
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

      const paramsObjKeys = Object.keys(paramsObj);
      let dataKeys;

      if (paramsObjKeys.length) {
        ({dataKeysPart: dataKeys} = dataKeysCollect({
          dataKeys: [],
          dataObj: paramsObj,
          parentObjAsStr: '',
          //partialShort // For debugging.
        }));
      }

      const paramKeys = dataKeys;
      const partialText_ = partials[partialShort] || '';
      let delimiterUnicodes;
      let partialParseArr = [];
      let partialText = '';

      if (partialsComp[partialShort].parseArr) {
        partialParseArr = partialsComp[partialShort].parseArr;
      }
      // DEPRECATED.
      // TODO: This accommodates old usage of partialsComp. To be removed.
      else {
        partialParseArr = hogan.parse(
          hogan.scan(
            partials[partialShort],
            options.delimiters
          ),
          partials[partialShort],
          options
        );
        partialsComp[partialShort] = {
          parseArr: partialParseArr,
          compilation: partialsComp[partialShort]
        };
      }

      ({
        delimiterUnicodes,
        partialText
      } = paramsApply({
        contextKeys,
        paramKeys,
        paramsObj,
        partialParseArr,
        //partialShort, // For debugging.
        partialText_
      }));

      if (delimiterUnicodes && partialText !== partialText_) {
        // First, render with unicode delimiters.
        const optionsWithUnicodes = Object.assign({delimiters: delimiterUnicodes}, options);
        const compilationWithUnicodes = hogan.generate(
          hogan.parse(
            hogan.scan(
              partialText,
              delimiterUnicodes
            ),
            partialText,
            optionsWithUnicodes
          ),
          partialText,
          optionsWithUnicodes
        );
        partials[partialFull] = compilationWithUnicodes.render(paramsObj);

        // Then, write to partialsComp with previous render as partial text and with regular delimiters and options.
        const parseArr = hogan.parse(
          hogan.scan(
            partials[partialFull],
            options.delimiters
          ),
          partials[partialFull],
          options
        );
        partialsComp[partialFull] = {
          parseArr,
          compilation: hogan.generate(parseArr, partials[partialFull], options)
        };
      }
    }

    return {
      partials,
      partialsComp
    };
  };
}

// The exposed methods are object-oriented in methodology. When invoked as object instance methods, they may mutate
// instance data in a way hidden from outside the method. Invoking functions may similarly not directly depend on the
// returned data.
METHODS: {
  var preProcessContextKeys = function (context) {
    /* istanbul ignore if */
    if (!context) {
      return [];
    }

    const {dataKeysPart: dataKeys} = dataKeysCollect({
      dataKeys: [],
      dataObj: context,
      parentObjAsStr: '',
    });

    let contextKeysPart = [];

    if (dataKeys.length) {
      ({contextKeysPart} = contextKeysCollect({
        dataKeys
      }));
    }

    return contextKeysPart;
  };

  var preProcessPartialParams =
  function (text, compilation_, partials_, partialsComp_, contextKeys_, context, options_) {
    const options = options_ || this.options || {};
    const compilation = compilation_ || hogan.compile(text, options);
    const partialsKeys = Object.keys(compilation.partials);
    let contextKeys = contextKeys_ || (this && this.contextKeys);
    let _contextKeys;

    // First, check if we still need to preprocess contextKeys because .render() was called statically.
    if (typeof contextKeys === 'undefined') {
      let hasParam = false;

      for (let i = 0, l = partialsKeys.length; i < l; i++) {
        const partialFull = compilation.partials[partialsKeys[i]].name;
        hasParam = paramRegex.test(partialFull) || partialFull.includes(':');

        if (hasParam) {
          break;
        }
      }

      if (hasParam) {
        contextKeys = _contextKeys = preProcessContextKeys(context);
      }
      else {
        contextKeys = [];
      }
    }

    let partials = partials_ || this.partials || {};
    let partialsComp = partialsComp_ || this.partialsComp || {};

    if (partialsKeys.length) {
      ({
        partials,
        partialsComp
      } = partialsWithParamsAdd({
        compilation,
        contextKeys,
        partialsKeys,
        partials,
        partialsComp,
        options
      }));
    }

    return {
      compilation,
      _contextKeys, // Only defined if hasParam.
      partials,
      partialsComp
    };
  };

  var compile = function (text, options_, partials_, partialsComp_, contextKeys_, context) {
    const options = options_ || this.options || {};
    let compilation = hogan.compile(text, options);
    let contextKeys = contextKeys_ || (this && this.contextKeys);
    let _contextKeys;
    let partials = partials_ || this.partials || {};
    let partialsComp = partialsComp_ || this.partialsComp || {};

    const partialsKeys = Object.keys(partials);

    for (let i = 0, l = partialsKeys.length; i < l; i++) {
      const partialKey = partialsKeys[i];

      // DEPRECATED.
      // TODO: This accommodates old usage of partialsComp. To be removed.
      if (!partialsComp[partialKey].compilation) {
        const parseArr = hogan.parse(
          hogan.scan(
            partials[partialKey],
            options.delimiters
          ),
          partials[partialKey],
          options
        );
        partialsComp[partialKey] = {
          parseArr,
          compilation: partialsComp[partialKey]
        };
      }

      ({
        _contextKeys,
        partials,
        partialsComp
      } = preProcessPartialParams(
        partials[partialKey],
        partialsComp[partialKey].compilation,
        partials,
        partialsComp,
        contextKeys,
        context,
        options
      ));
    }

    if (_contextKeys) {
      contextKeys = _contextKeys;
    }

    ({
      compilation
    } = preProcessPartialParams(
      text,
      compilation,
      partials,
      partialsComp,
      contextKeys,
      context,
      options
    ));

    return compilation;
  };

  var registerPartial = function (partialName, partialTemplate, partialCom, partials_, partialsComp_, options_) {
    const partials = partials_ || this.partials || {};
    const partialsComp = partialsComp_ || this.partialsComp || {};
    const options = options_ || this.options || {};

    if (!partials[partialName]) {
      partials[partialName] = partialTemplate;
    }

    if (!partialsComp[partialName]) {
      if (partialCom) {
        partialsComp[partialName] = partialCom;
      }
      else {
        const parseArr = hogan.parse(hogan.scan(partialTemplate, options.delimiters));

        partialsComp[partialName] = {
          parseArr,
          compilation: hogan.generate(parseArr, partialTemplate, options)
        };
      }
    }

    return {
      partials,
      partialsComp
    };
  };

  var render = function (text = '', context_, partials_, partialsComp_, contextKeys_, options_) {
    const context = context_ || this.context || {};
    const contextKeys = contextKeys_ || (this && this.contextKeys);
    const options = options_ || this.options || {};
    let partials = partials_ || this.partials || {};
    let partialsComp = partialsComp_ || this.partialsComp || {};
    let partialsKeys = Object.keys(partials);

    for (let i = 0, l = partialsKeys.length; i < l; i++) {
      const partialKey = partialsKeys[i];
      let partialsPart;
      let partialsCompPart;

      if (!partialsComp[partialKey]) {
        ({
          partialsPart,
          partialsCompPart
        } = registerPartial(partialKey, partials[partialKey], null, partials, partialsComp, options));

        Object.assign(partialsComp, partialsCompPart);

        if (!partials[partialKey]) {
          Object.assign(partials, partialsPart);
        }
      }
    }

    let compilation;

    if (Object.keys(partialsComp).length) {
      compilation = compile(text, options, partials, partialsComp, contextKeys, context);
    }
    else {
      compilation = hogan.compile(text, options);
    }

    return compilation.render(context, partials, null, partialsComp);
  };

  var unregisterPartial = function (partialKey, partials_, partialsComp_) {
    const partials = partials_ || this.partials || {};
    const partialsComp = partialsComp_ || this.partialsComp || {};

    delete partials[partialKey];
    delete partialsComp[partialKey];

    return {
      partials,
      partialsComp
    };
  };
}

// PREPARE FOR EXPORT.

function Feplet(context, partials, partialsComp, contextKeys, options) {
  this.context = context || {};
  this.partials = partials || {};
  this.partialsComp = partialsComp || {};
  this.contextKeys = contextKeys || preProcessContextKeys(this.context);
  this.options = options || {};
}

// STATIC METHODS.

Object.assign(Feplet, hogan); // hogan is not a class so the constructor does not get overridden.

Feplet.compile = compile;

Feplet.preProcessContextKeys = preProcessContextKeys;

Feplet.preProcessPartialParams = preProcessPartialParams;

Feplet.registerPartial = registerPartial;

Feplet.render = render;

Feplet.unregisterPartial = unregisterPartial;

// INSTANCE METHODS.

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
else if (typeof window === 'object') {
  window.Feplet = Feplet;
}

module.exports = Feplet;
