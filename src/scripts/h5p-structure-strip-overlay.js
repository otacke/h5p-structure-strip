import "../styles/h5p-structure-strip-overlay.css";
import Util from './h5p-structure-strip-util';

/** Class representing the content */
export default class Overlay {
  /**
   * @constructor
   *
   * @param {object} params Parameters.
   * @param {HTMLElement} params.content Content to set.
   * @param {object} callbacks, Callbacks.
   */
  constructor(params, callbacks = {}) {
    this.params = Util.extend({
      container: document.body,
      content: document.createElement('div'),
      styleBase: 'h5p-structure-strip-overlay',
      title: '',
      position: {
        offsetHorizontal : 0,
        offsetVertical : 0
      },
      a11y: {
        closeWindow: 'Close'
      }
    }, params);

    this.callbacks = callbacks;
    this.callbacks.onClose = callbacks.onClose || (() => {});

    this.isVisible = false;
    this.focusableElements = [];

    // DOM
    this.overlay = document.createElement('div');
    this.overlay.classList.add(`${this.params.styleBase}-container`);
    this.overlay.classList.add(`${this.params.styleBase}-invisible`);
    if (this.params.a11y.title) {
      this.overlay.setAttribute('aria-label', this.params.a11y.title);
    }
    this.overlay.setAttribute('aria-modal', 'true');

    this.outer = document.createElement('div');
    this.outer.classList.add(`${this.params.styleBase}-outer`);
    this.overlay.appendChild(this.outer);

    this.headline = document.createElement('div');
    this.headline.classList.add(`${this.params.styleBase}-headline`);
    this.outer.appendChild(this.headline);

    this.title = document.createElement('div');
    this.title.classList.add(`${this.params.styleBase}-title`);
    this.headline.appendChild(this.title);

    this.buttonClose = document.createElement('button');
    this.buttonClose.classList.add(`${this.params.styleBase}-button-close`);
    this.buttonClose.setAttribute('aria-label', this.params.a11y.closeWindow);
    this.buttonClose.addEventListener('click', () => {
      this.callbacks.onClose();
    });
    this.headline.appendChild(this.buttonClose);

    this.contentWrapper = document.createElement('div');
    this.contentWrapper.classList.add(`${this.params.styleBase}-content-wrapper`);
    this.outer.appendChild(this.contentWrapper);

    this.content = document.createElement('div');
    this.content.classList.add(`${this.params.styleBase}-content`);
    this.content.appendChild(this.params.content);
    this.contentWrapper.appendChild(this.content);

    // Trap focus if overlay is visible
    document.addEventListener('focus', event => {
      if (!this.isVisible || this.focusableElements.length === 0) {
        return;
      }

      this.trapFocus(event);
    }, true);

    //
    //
    // this.overlay.classList.add(`${this.params.styleBase}-outer-wrapper`);
    // this.overlay.classList.add('h5p-structure-strip-invisible');
    // this.overlay.setAttribute('role', 'dialog');
    // if (this.params.a11y.title) {
    //   this.overlay.setAttribute('aria-label', this.params.a11y.title);
    // }
    // this.overlay.setAttribute('aria-modal', 'true');
    //
    // this.title = document.createElement('div');
    // this.title.
    //
    // this.content = document.createElement('div');
    // this.content.classList.add(`${this.params.styleBase}-content`);
    // this.content.appendChild(this.params.content);
    // this.overlay.appendChild(this.content);
    //
    // this.buttonClose = document.createElement('button');
    // this.buttonClose.classList.add(`${this.params.styleBase}-button-close`);
    // this.buttonClose.setAttribute('aria-label', this.params.a11y.closeWindow);
    // this.buttonClose.addEventListener('click', () => {
    //   this.callbacks.onClose();
    // });
    // this.overlay.appendChild(this.buttonClose);
    //
    // // Trap focus if overlay is visible
    // document.addEventListener('focus', event => {
    //   if (!this.isVisible || this.focusableElements.length === 0) {
    //     return;
    //   }
    //
    //   this.trapFocus(event);
    // }, true);

    // Blocker
    this.blocker = document.createElement('div');
    this.blocker.classList.add(`${this.params.styleBase}-blocker`);
    this.blocker.classList.add(`${this.params.styleBase}-display-none`);
    this.blocker.addEventListener('click', () => {
      this.callbacks.onClose();
    });

    // Extra classes
    this.modifierClasses = [];
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.overlay;
  }

  /**
   * Set overlay title.
   * @param {string} [title=''] Title to set.
   */
  setTitle(title = '') {
    this.title.innerHTML = Util.htmlDecode(title);
  }

  /**
   * Set overlay content.
   * @param {HTMLElement} content Content to set.
   */
  setContent(content) {
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild);
    }
    this.content.appendChild(content);
  }

  /**
   * Set an extra class that can be used for CSS styling.
   * @param {string} className Class name.
   * @param {boolean} [clear=true] If false, will not erase all other extra classes.
   */
  setModifierClass(className, clear = true) {
    if (clear) {
      this.modifierClasses.forEach(oldClassName => {
        this.overlay.classList.remove(oldClassName);
      });
      this.modifierClasses = [];
    }

    if (this.modifierClasses.indexOf(className) === -1) {
      this.modifierClasses.push(className);
    }

    this.overlay.classList.add(className);
  }

  /**
   * Trap focus in overlay.
   * @param {Event} event Focus event.
   */
  trapFocus(event) {
    if (this.isChild(event.target)) {
      this.currentFocusElement = event.target;
      return; // Focus is inside overlay
    }

    // Focus was either on first or last overlay element
    if (this.currentFocusElement === this.focusableElements[0]) {
      this.currentFocusElement = this.focusableElements[this.focusableElements.length - 1];
    }
    else {
      this.currentFocusElement = this.focusableElements[0];
    }
    this.currentFocusElement.focus();
  }

  /**
   * Check whether an HTML element is a child of the overlay.
   * @param {HTMLElement} element.
   * @return {boolean} True, if element is a child.
   */
  isChild(element) {
    const parent = element.parentNode;

    if (!parent) {
      return false;
    }

    if (parent === this.overlay) {
      return true;
    }

    return this.isChild(parent);
  }

  /**
   * Update list of focusable elements.
   */
  updateFocusableElements() {
    this.focusableElements = []
      .slice.call(this.overlay.querySelectorAll('video, audio, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(element => element.getAttribute('disabled') !== 'true' && element.getAttribute('disabled') !== true);
  }

  /**
   * Show overlay.
   */
  show() {
    if (!this.blockerAppended) {
      this.container = document.body.querySelector('.h5p-container');
      this.container.appendChild(this.blocker);
    }
    this.blockerAppended = true;

    this.overlay.classList.remove('h5p-structure-strip-overlay-invisible');
    this.blocker.classList.remove('h5p-structure-strip-overlay-display-none');

    setTimeout(() => {
      this.updateFocusableElements(); // Won't find YouTube elements in iframe

      const hasFocusableElement = this.focusableElements.length > 0;
      const isUsingKeyboard = document.querySelector('.h5p-content.using-mouse') === null;

      if (hasFocusableElement && isUsingKeyboard) {
        this.focusableElements[0].focus();
      }

      this.isVisible = true;

      this.resize();
    }, 0);
  }

  /**
   * Hide overlay.
   */
  hide() {
    this.isVisible = false;
    this.overlay.classList.add('h5p-structure-strip-overlay-invisible');
    this.blocker.classList.add('h5p-structure-strip-overlay-display-none');
  }

  /**
   * Resize.
   */
  resize() {
    if (!this.isVisible) {
      return;
    }

    const maxHeightCSS = this.computeMaxHeightCSS();
    if (maxHeightCSS) {
      this.outer.style.maxHeight = maxHeightCSS;
    }
  }

  /**
   * Compute max heigth CSS. Can't know because of relative height of overlay.
   */
  computeMaxHeightCSS() {
    const h5pContainer = document.querySelector('.h5p-container');

    if (!h5pContainer) {
      return null;
    }

    this.outerStyle = this.outerStyle || window.getComputedStyle(this.outer);

    return (`calc(${h5pContainer.offsetHeight}px - ${this.outerStyle.getPropertyValue('margin-top')} - ${this.outerStyle.getPropertyValue('margin-bottom')})`);
  }
}
