import Util from './h5p-structure-strip-util';

/** Class representing the content */
export default class StructureStripSection {
  /**
   * @constructor
   * @param {object} params Parameters.
   * @param {object} callbacks Callbacks.
   */
  constructor(params, callbacks) {
    this.params = Util.extend({
      color: 'rgba(255, 255, 255, 0)',
      title: '',
      description: '',
      text: '',
      weight: 1,
      a11y: {
        showHints: 'showHints'
      }
    }, params);

    this.callbacks = callbacks || {};
    this.callbacks.onContentChanged = callbacks.onContentChanged || (() => {});
    this.callbacks.onHintButtonOpened = callbacks.onHintButtonOpened || (() => {});

    this.content = document.createElement('div');
    this.content.classList.add('h5p-structure-strip-text-strip');

    const descriptionContainer = document.createElement('div');
    descriptionContainer.classList.add('h5p-structure-strip-text-strip-description-container');
    descriptionContainer.style.backgroundColor = this.params.colorBackground;
    descriptionContainer.style.color = this.params.colorText;

    // Title
    const descriptionTitle = document.createElement('div');
    descriptionTitle.classList.add('h5p-structure-strip-text-strip-description-title');
    descriptionContainer.appendChild(descriptionTitle);

    // Title text
    const descriptionTitleText = document.createElement('span');
    descriptionTitleText.classList.add('h5p-structure-strip-text-strip-description-title-text');
    descriptionTitleText.innerHTML = Util.htmlDecode(this.params.title);
    descriptionTitle.appendChild(descriptionTitleText);

    // Hint button
    if (this.params.hasDescription) {
      const buttonHint = document.createElement('button');
      buttonHint.classList.add('h5p-structure-strip-text-strip-button-hint');
      buttonHint.style.color = this.params.colorText;
      buttonHint.setAttribute('aria-label', this.params.a11y.showHints);

      buttonHint.addEventListener('click', () => {
        this.callbacks.onHintButtonOpened(this.params.id);
      });

      descriptionTitle.appendChild(buttonHint);
    }

    // Feedback
    if (this.params.feedbackMode === 'whileTyping') {
      this.descriptionStatus = document.createElement('div');
      this.descriptionStatus.classList.add('h5p-structure-strip-text-strip-description-status');
      this.descriptionStatus.innerHTML = '';
      descriptionContainer.appendChild(this.descriptionStatus);
    }

    // Text input field
    const input = document.createElement('div');
    input.classList.add('h5p-structure-strip-text-strip-input-container');

    this.inputField = document.createElement('textarea');
    this.inputField.classList.add('h5p-structure-strip-text-strip-input-field');
    this.inputField.setAttribute('rows', 5);
    this.inputField.setAttribute('aria-label', this.buildAriaLabel([this.params.title]));
    this.inputField.value = this.params.text;

    // Add listeners if feedback should be given while typing
    if (this.params.feedbackMode === 'whileTyping') {
      ['change', 'keyup', 'paste'].forEach(event => {
        this.inputField.addEventListener(event, this.callbacks.onContentChanged);
      });

      this.inputField.addEventListener('focus', () => {
        this.inputField.setAttribute('aria-label', this.buildAriaLabel([this.params.title, this.descriptionStatus.innerHTML]));
      });
    }

    input.appendChild(this.inputField);

    this.content.appendChild(descriptionContainer);
    this.content.appendChild(input);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Enable for input.
   */
  enable() {
    this.inputField.disabled = false;
  }

  /**
   * Disable for input.
   */
  disable() {
    this.inputField.disabled = true;
  }

  /**
   * Get id.
   * @return {number} Id.
   */
  getId() {
    return this.params.id;
  }

  /**
   * Get text.
   * @return {string} Text.
   */
  getText() {
    return this.inputField.value || '';
  }

  /**
   * Get title.
   * @return {string} Title.
   */
  getTitle() {
    return this.params.title;
  }

  /**
   * Get text length.
   * @return {number} Text length.
   */
  getLength() {
    this.getText().length;
  }

  /**
   * Get weight.
   * @return {number} Weight.
   */
  getWeight() {
    return this.params.weight;
  }

  /**
   * Set status text.
   * @param {string} [text=''] Status text to set.
   */
  setStatus(text = '') {
    if (!this.descriptionStatus) {
      return;
    }
    this.descriptionStatus.innerHTML = text;
  }

  /**
   * Build aria label.
   * @param {string[]} [texts=[]] Texts.
   * @return {string} Aria label.
   */
  buildAriaLabel(texts = []) {
    return texts
      .map(text => {
        text = Util.htmlDecode(text);
        return (text.slice(-1) === '.') ? text.slice(0, -1) : text;
      }).join('. ');
  }
}
