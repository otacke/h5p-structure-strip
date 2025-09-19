/** @constant {number} HEX Hexadecimal radix. */
const HEX = 16;

const LUMINANCE_FACTOR_RED = 0.299;
const LUMINANCE_FACTOR_GREEN = 0.587;
const LUMINANCE_FACTOR_BLUE = 0.114;

/** @constant {number} LUMINANCE_THRESHOLD Threshold for luminance to decide light/dark color. */
const LUMINANCE_THRESHOLD = 0.5;

/** Class for utility functions */
class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @returns {object} Merged objects.
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
   * @returns {string} Output string.
   */
  static htmlDecode(input) {
    var dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent.replace(/(\r\n|\n|\r)/gm, '');
  }

  /**
   * Get closest parent node by selector.
   * @param {HTMLElement} node Node.
   * @param {string} selector CSS classname, id or tagname.
   * @returns {HTMLElement|null} Closest parent node by selector or null.
   */
  static closestParent(node, selector) {
    if (typeof node !== 'object' || typeof selector !== 'string') {
      return null; // missing or invalid value
    }

    if (!node.parentNode) {
      return null; // no parent left
    }

    if (selector.substring(0, 1) === '.') { // classnames
      const selectors = selector.split('.').filter((selector) => selector !== '');
      if (selectors.every((selector) => node.parentNode.classList.contains(selector))) {
        return node.parentNode;
      }
    }
    else if (selector.substring(0, 1) === '#') { // id
      if (
        typeof node.parentNode.getAttribute === 'function' &&
        node.parentNode.getAttribute('id') === selector.substring(1)
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
   * @param {number} [a] First number.
   * @param {number} [b] Second number.
   * @returns {number} Greatest common divisor.
   */
  static greatestCommonDivisor(a = 1, b = 1) {
    return (!b) ? a : Util.greatestCommonDivisor(b, a % b);
  }

  /**
   * Compute greatest common divisor.
   * @param {number[]} numbers Numbers.
   * @returns {number} Greatest common divisor.
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
      console.error(
        'Cannot copy to clipboard: navigator.clipboard not supported',
      );
      callback(false);
    }

    navigator.clipboard.writeText(text).then(() => {
      callback(true);
    }, (error) => {
      console.error('Cannot copy to clipboard: ', error);
      callback(false);
    });
  }

  /**
   * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
   * Cmp. https://tools.ietf.org/html/rfc5646
   * @param {string} languageCode Language tag.
   * @returns {string} Formatted language tag.
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
   * @returns {number} HSV value as [0-1];
   */
  static computeHSVValue(colorCode) {
    if (typeof colorCode !== 'string' || !/#[0-9a-f]{6}/.test(colorCode)) {
      return null;
    }

    colorCode = colorCode.substring(1);

    // RGB as percentage
    const rgb = [
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(0, 2), HEX),
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(2, 4), HEX),
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(4, 6), HEX),
    ];

    // HSV value
    // eslint-disable-next-line no-magic-numbers
    return Math.max(rgb[0], rgb[1], rgb[2]) / 255;
  }

  /**
   * Compute contrast color to given color.
   * @param {string} colorCode RGB color code in 6 char hex: #rrggbb.
   * @param {number} [difference] Percentual difference: [0-1].
   * @returns {string} RGB contrast color code in 6 char hex: #rrggbb.
   */
  static computeContrastColor(colorCode, difference = 0.5) {
    if (typeof colorCode !== 'string' || !/#[0-9a-f]{6}/.test(colorCode)) {
      return null;
    }

    if (typeof difference !== 'number') {
      difference = LUMINANCE_THRESHOLD;
    }

    difference = Math.min(Math.max(0, difference), 1);

    colorCode = colorCode.substring(1);

    // RGB as percentage
    const rgb = [
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(0, 2), HEX) / 255,
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(2, 4), HEX) / 255,
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(4, 6), HEX) / 255,
    ];

    // HSV value
    const cMax = Math.max(rgb[0], rgb[1], rgb[2]);

    // Scale up/down depending on HSV value
    const cNew = Math.min(Math.max(0, (cMax > LUMINANCE_THRESHOLD) ? cMax - difference : cMax + difference), 1);
    const factor = cNew / cMax;

    const rgbNew = [
      // eslint-disable-next-line no-magic-numbers
      Util.dec2hex(rgb[0] * factor * 255, 2),
      // eslint-disable-next-line no-magic-numbers
      Util.dec2hex(rgb[1] * factor * 255, 2),
      // eslint-disable-next-line no-magic-numbers
      Util.dec2hex(rgb[2] * factor * 255, 2),
    ];

    return `#${rgbNew.join('')}`;
  }

  /**
   * Compute focus color to given color.
   * @param {string} colorCode Color code in 6 char hex: #rrggbb.
   * @returns {string} RGB focus color code in 6 char hex: #rrggbb.
   */
  static computeFocusColor(colorCode) {
    if (typeof colorCode !== 'string' || !/#[0-9a-f]{6}/.test(colorCode)) {
      return null;
    }

    colorCode = colorCode.substring(1);

    // RGB as percentage
    const rgb = [
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(0, 2), HEX),
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(2, 4), HEX),
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(4, 6), HEX),
    ];

    // Calculate the luminance
    const luminance =
      // eslint-disable-next-line no-magic-numbers
      (LUMINANCE_FACTOR_RED * rgb[0] + LUMINANCE_FACTOR_GREEN * rgb[1] + LUMINANCE_FACTOR_BLUE * rgb[2]) / 255;

    return luminance < LUMINANCE_THRESHOLD ? '#ffffff' : '#000000';
  }

  /**
   * Convert decimals to hexadecimals.
   * @param {number} decimal Decimal.
   * @param {number} [padding] Padding.
   * @returns {string} Padded hexadecimal.
   */
  static dec2hex(decimal, padding = 0) {
    if (typeof decimal !== 'number') {
      return null;
    }

    if (typeof padding !== 'number' || padding < 0) {
      padding = 0;
    }

    let hex = Math.abs(Math.round(decimal)).toString(HEX);
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
