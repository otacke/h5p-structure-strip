/** Class for utility functions */
class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @param {object} arguments Objects to be merged.
   * @return {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (typeof arguments[0][key] === 'object' && typeof arguments[i][key] === 'object') {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  /**
   * Retrieve true string from HTML encoded string.
   * @param {string} input Input string.
   * @return {string} Output string.
   */
  static htmlDecode(input) {
    var dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent.replace(/(\r\n|\n|\r)/gm, '');
  }

  /**
   * Get closest parent node by selector.
   * @param {HTMLElement} node Node.
   * @param {string} selector CSS classname, id or tagname.
   * @return {HTMLElement|null} Closest parent node by selector or null.
   */
  static closestParent(node, selector) {
    if (typeof node !== 'object' || typeof selector !== 'string') {
      return null; // missing or invalid value
    }

    if (!node.parentNode) {
      return null; // no parent left
    }

    if (selector.substr(0, 1) === '.') { // classnames
      const selectors = selector.split('.').filter(selector => selector !== '');
      if (selectors.every(selector => node.parentNode.classList.contains(selector))) {
        return node.parentNode;
      }
    }
    else if (selector.substr(0, 1) === '#') { // id
      if (
        typeof node.parentNode.getAttribute === 'function' &&
        node.parentNode.getAttribute('id') === selector.substr(1)
      ) {
        return node.parentNode;
      }
    }
    else if (node.parentNode.tagName.toLowerCase() === selector.toLowerCase()) { // tagname
      return node.parentNode;
    }

    return this.closestParent(node.parentNode, selector);
  }

  /**
   * Compute greatest common divisor.
   * @param {number} [a=1] First number.
   * @param {number} [b=1] Second number.
   * @return {number} Greatest common divisor.
   */
  static greatestCommonDivisor(a = 1, b = 1) {
    return (!b) ? a : Util.greatestCommonDivisor(b, a % b);
  }

  /**
   * Compute greatest common divisor.
   * @param {number[]} numbers Numbers.
   * @return {number} Greatest common divisor.
   */
  static greatestCommonDivisorArray(numbers) {
    return numbers.reduce((previous, current) => {
      if (!previous) {
        return 1;
      }

      return Util.greatestCommonDivisor(previous, current);
    });
  }

  /**
   * Copy text to clipboard.
   * Cmp. https://stackoverflow.com/a/30810322
   * @param {string} text Text to copy to clipboard.
   * @param {function} [callback] Callback accepting true/false as param.
   */
  static copyTextToClipboard(text, callback = () => {}) {
    if (!navigator.clipboard) {
      Util.fallbackCopyTextToClipboard(text, callback);
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      callback(true);
    }, error => {
      console.error('Cannot copy to clipboard: ', error);
      callback(false);
    });
  }

  /**
   * Copy text to clipboard.
   * @param {string} text Text to copy.
   * @param {function} [callback] Callback accepting true/false as param.
   */
  static fallbackCopyTextToClipboard(text, callback = () => {}) {
    const textArea = document.createElement('textarea');

    // Place in top-left corner of screen regardless of scroll position
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure small width/height. 1px / 1em gives negative w/h on some browsers
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // Reduce size if flashing when rendering
    textArea.style.padding = 0;

    // Clean up any borders
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason
    textArea.style.background = 'transparent';

    textArea.value = text;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let result = true;
    try {
      document.execCommand('copy');
    }
    catch (error) {
      console.warn('Cannot copy to clipboard.');
      result = false;
    }

    document.body.removeChild(textArea);
    callback(result);
  }

  /**
   * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
   * Cmp. https://tools.ietf.org/html/rfc5646
   * @param {string} languageTag Language tag.
   * @return {string} Formatted language tag.
   */
  static formatLanguageCode(languageCode) {
    if (typeof languageCode !== 'string') {
      return languageCode;
    }

    /*
     * RFC 5646 states that language tags are case insensitive, but
     * recommendations may be followed to improve human interpretation
     */
    const segments = languageCode.split('-');
    segments[0] = segments[0].toLowerCase(); // ISO 639 recommendation
    if (segments.length > 1) {
      segments[1] = segments[1].toUpperCase(); // ISO 3166-1 recommendation
    }
    languageCode = segments.join('-');

    return languageCode;
  }

  /**
   * Compute HSV value.
   * @param {string} colorCode RGB color code in 6 char hex: #rrggbb.
   * @return {number} HSV value as [0-1];
   */
  static computeHSVValue(colorCode) {
    if (typeof colorCode !== 'string' || !/#[0-9a-f]{6}/.test(colorCode)) {
      return null;
    }

    colorCode = colorCode.substr(1);

    // RGB as percentage
    const rgb = [
      parseInt(colorCode.substr(0, 2), 16),
      parseInt(colorCode.substr(2, 2), 16),
      parseInt(colorCode.substr(4, 2), 16)
    ];

    // HSV value
    return Math.max(rgb[0], rgb[1], rgb[2]) / 255;
  }

  /**
   * Compute contrast color to given color.
   * @param {string} colorCode RGB color code in 6 char hex: #rrggbb.
   * @param {number} [difference=0.5] Percentual difference: [0-1].
   * @return {string} RGB contrast color code in 6 char hex: #rrggbb.
   */
  static computeContrastColor(colorCode, difference = 0.5) {
    if (typeof colorCode !== 'string' || !/#[0-9a-f]{6}/.test(colorCode)) {
      return null;
    }

    if (typeof difference !== 'number') {
      difference = 0.5;
    }

    difference = Math.min(Math.max(0, difference), 1);

    colorCode = colorCode.substr(1);

    // RGB as percentage
    const rgb = [
      parseInt(colorCode.substr(0, 2), 16) / 255,
      parseInt(colorCode.substr(2, 2), 16) / 255,
      parseInt(colorCode.substr(4, 2), 16) / 255
    ];

    // HSV value
    const cMax = Math.max(rgb[0], rgb[1], rgb[2]);

    // Scale up/down depending on HSV value
    const cNew = Math.min(Math.max(0, (cMax > 0.5) ? cMax - difference : cMax + difference), 1);
    const factor = cNew / cMax;

    const rgbNew = [
      Util.dec2hex(rgb[0] * factor * 255, 2),
      Util.dec2hex(rgb[1] * factor * 255, 2),
      Util.dec2hex(rgb[2] * factor * 255, 2)
    ];

    return `#${rgbNew.join('')}`;
  }

  /**
   * Convert decimals to hexadecimals.
   * @param {number} decimal Decimal.
   * @param {number} [padding=0] Padding.
   * @return {string} Padded hexadecimal.
   */
  static dec2hex(decimal, padding = 0) {
    if (typeof decimal !== 'number') {
      return null;
    }

    if (typeof padding !== 'number' || padding < 0) {
      padding = 0;
    }

    let hex = Math.abs(Math.round(decimal)).toString(16);
    while (hex.length < padding) {
      hex = `0${hex}`;
    }
    if (decimal < 0) {
      hex = `-${hex}`;
    }

    return hex;
  }
}

export default Util;
