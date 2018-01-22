'use strict';

/**
 * The steps on a high-level are as follows:
 *   * First, try to parse the string with JSON5.
 *   * If that fails, crawl through the submitted string, modifying the data in
 *     the following manner:
 *   * Further escape all escaped quotes and colons. Use the string
 *     representation of their unicodes for this. This has the added bonus
 *     of being interpreted correctly by JSON5.parse() without further
 *     modification. This will be useful later in the function.
 *   * Once escaped quotes are out of the way, we know the remaining quotes
 *     are either key/value wrappers or wrapped within those wrappers. We know
 *     that remaining commas and colons are either delimiters, or wrapped
 *     within quotes to not be recognized as such.
 *   * A do-while loop crawls laxString to write keys to a keys array and
 *     values to a values array.
 *   * Start by parsing the first key. Determine the type of wrapping quote,
 *     if any.
 *   * By knowing the open wrapper, we know that the next quote of that kind
 *     (if the key is wrapped in quotes), HAS to be the close wrapper.
 *     Similarly, if the key is unwrapped, we know the next colon HAS to be
 *     the delimiter between key and value.
 *   * Save the key to the keys array.
 *   * Next, search for a value. It will either be the next block wrapped in
 *     quotes, or a string of alphanumerics, decimal points, or minus signs.
 *   * Save the value to the values array.
 *   * The do-while loop truncates the laxString value while parsing. Its
 *     condition for completion is when the laxString is whittled down to an
 *     empty string.
 *   * After the keys and values arrays are built, a for loop iterates through
 *     them to build the final jsonString.
 *   * No quote substitution had been done prior to this loop. In this loop,
 *     all keys are ensured to be wrapped in double-quotes. String values are
 *     also ensured to be wrapped in double-quotes.
 *   * Unescape escaped unicodes except for double-quotes. Everything beside
 *     double-quotes will be wrapped in double-quotes without need for escape.
 *   * Return jsonString.
 *
 * @param {string} lString - a JSON-like string.
 * @return {object} JS object.
 */
module.exports = function (lString) {
  var JSON5 = require('json5');

  var colonPos = -1;
  var keys = [];
  var laxString = lString.trim(); // To not reassign param.
  var jsObject;
  var jsonString;
  var quotePos = -1;
  var regex;
  var values = [];
  var wrapper;

  // First, try parsing valid JSON5.
  try {
    jsObject = JSON5.parse(laxString);
  }

  // Else, crawl through string to massage it into valid JSON5.
  catch (err) {
    // Replace all escaped double-quotes with escaped unicode.
    laxString = laxString.replace(/\\"/g, '\\u0022');

    // Replace all escaped single-quotes with escaped unicode.
    laxString = laxString.replace(/\\'/g, '\\u0027');

    // Replace all escaped colons with escaped unicode.
    laxString = laxString.replace(/\\:/g, '\\u0058');

    // With escaped chars out of the way, crawl through laxString looking for keys
    // and values.
    do {

      // Check if searching for a key.
      if (laxString[0] === '{' || laxString[0] === ',') {
        laxString = laxString.substring(1, laxString.length).trim();

        // Search for end quote if wrapped in quotes. else search for colon.
        // Everything up to that position will be saved in the keys array.
        switch (laxString[0]) {

          // Need to search for end quote pos in case the quotes wrap a colon.
          case '"':
          case '\'':
            wrapper = laxString[0];
            quotePos = laxString.indexOf(wrapper, 1);
            break;

          default:
            colonPos = laxString.indexOf(':');
        }

        if (quotePos > -1) {
          keys.push(laxString.substring(0, quotePos + 1).trim());

          // Truncate the beginning from laxString and look for a value.
          laxString = laxString.substring(quotePos + 1, laxString.length).trim();

          // Unset quotePos.
          quotePos = -1;
        }
        else if (colonPos > -1) {
          keys.push(laxString.substring(0, colonPos).trim());

          // Truncate the beginning from laxString and look for a value.
          laxString = laxString.substring(colonPos, laxString.length);

          // Unset colonPos.
          colonPos = -1;

        // If there are no more colons, and we're looking for a key, there is
        // probably a problem. Stop any further processing.
        }
        else {
          laxString = '';
          break;
        }
      }

      // Now, search for a value.
      if (laxString[0] === ':') {
        laxString = laxString.substring(1, laxString.length).trim();

        // The only reason we're using regexes here, instead of indexOf(), is
        // because we don't know if the next delimiter is going to be a comma or a
        // closing curly brace. Since it's not much of a performance hit to use
        // regexes as sparingly as here, and it's much more concise and readable,
        // we'll use a regex for match() and replace() instead of performing
        // conditional logic with indexOf().
        switch (laxString[0]) {

          // Since a quote of same type as its wrappers would be escaped, and we
          // escaped those even further with their unicodes, it is safe to look
          // for wrapper pairs and conclude that their contents are values.
          case '"':
            regex = /^"[\S\s]*?"/;
            break;
          case '\'':
            regex = /^'[\S\s]*?'/;
            break;

          // If there is no value wrapper, regex for alphanumerics, decimal
          // points, and minus signs for exponential notation.
          default:
            regex = /^[\w\-\.]*/;
        }
        values.push(laxString.match(regex)[0].trim());

        // Truncate the beginning from laxString and continue either looking for a
        // key, or returning.
        laxString = laxString.replace(regex, '').trim();

        // Exit do while if the final char is '}'
        if (laxString === '}') {
          laxString = '';
          break;
        }

      // If there are no more colons, and we're looking for a value, there is
      // probably a problem. stop any further processing.
      }
      else {
        laxString = '';
        break;
      }
    } while (laxString);

    // Build jsonString string for JSON parsing.
    jsonString = '{';
    for (var i = 0; i < keys.length; i++) {

      // Keys.
      // Replace single-quote wrappers with double-quotes.
      if (keys[i][0] === '\'' && keys[i][keys[i].length - 1] === '\'') {
        jsonString += '"';

        // Any enclosed double-quotes must be escaped.
        jsonString += keys[i].substring(1, keys[i].length - 1).replace(/"/g, '\\"');
        jsonString += '"';
      }
      else {

        // Open wrap with double-quotes if no wrapper.
        if (keys[i][0] !== '"' && keys[i][0] !== '\'') {
          jsonString += '"';

          // This is to clean up vestiges from Pattern Lab PHP's escaping scheme.
          // F.Y.I. Pattern Lab PHP would allow special characters like question
          // marks in parameter keys so long as the key was unwrapped and the
          // special character escaped with a backslash. In Node, we need to wrap
          // those keys and unescape those characters.
          keys[i] = keys[i].replace(/\\/g, '');
        }

        jsonString += keys[i];

        // Close wrap with double-quotes if no wrapper.
        if (keys[i][keys[i].length - 1] !== '"' && keys[i][keys[i].length - 1] !== '\'') {
          jsonString += '"';
        }
      }

      // Colon delimiter.
      jsonString += ':';

      // Values.
      // Replace single-quote wrappers with double-quotes.
      if (values[i][0] === '\'' && values[i][values[i].length - 1] === '\'') {
        jsonString += '"';

        // Any enclosed double-quotes must be escaped.
        jsonString += values[i].substring(1, values[i].length - 1).replace(/"/g, '\\"');
        jsonString += '"';

      // For everything else, just add the value however it's wrapped.
      }
      else {
        jsonString += values[i];
      }

      // Comma delimiter.
      if (i < keys.length - 1) {
        jsonString += ',';
      }
    }
    jsonString += '}';

    // Unescape escaped unicode except for double-quotes.
    jsonString = jsonString.replace(/\\u0027/g, '\'');
    jsonString = jsonString.replace(/\\u0058/g, ':');

    try {
      jsObject = JSON5.parse(jsonString);
    }
    catch (err) {
      console.error('\n' + err.message);
    }
  }

  return jsObject;
};
