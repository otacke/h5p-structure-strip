import Util from '@services/util';

/** Class representing the content */
export default class StructureStripSection {
  /**
   * @class
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

    this.callbacks = Util.extend({
      onContentChanged: () => {},
      onHintButtonOpened: () => {},
      onInteracted: () => {}
    }, callbacks);

    // Create content DOM
    this.content = document.createElement('div');
    this.content.classList.add('h5p-structure-strip-text-strip');

    // Description Container
    const descriptionContainer = document.createElement('div');
    descriptionContainer.classList.add('h5p-structure-strip-text-strip-description-container');
    descriptionContainer.style.backgroundColor = this.params.colorBackground;
    descriptionContainer.style.color = this.params.colorText;
    this.content.appendChild(descriptionContainer);

    // Progress bar
    if (this.params.feedbackMode === 'whileTyping') {
      this.addProgressBar(descriptionContainer);
    }

    // Description
    this.addDescriptionWrapper(descriptionContainer);

    // Text input field
    this.addInputField();
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
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
   * @returns {number} Id.
   */
  getId() {
    return this.params.id;
  }

  /**
   * Get text.
   * @returns {string} Text.
   */
  getText() {
    return this.inputField.value || '';
  }

  /**
   * Get title.
   * @returns {string} Title.
   */
  getTitle() {
    return this.params.title;
  }

  /**
   * Get text length.
   * @returns {number} Text length.
   */
  getLength() {
    return this.getText().length;
  }

  /**
   * Get weight.
   * @returns {number} Weight.
   */
  getWeight() {
    return this.params.weight;
  }

  /**
   * Set status text.
   * @param {string} [text] Status text to set.
   */
  setStatus(text = '') {
    if (!this.descriptionStatus) {
      return;
    }
    this.descriptionStatus.innerHTML = text;
  }

  /**
   * Add progress bar.
   * @param {HTMLElement} descriptionContainer Container to add bar to.
   */
  addProgressBar(descriptionContainer) {
    this.progressBarContainer = document.createElement('div');
    this.progressBarContainer.classList.add('h5p-structure-strip-text-strip-progress-bar-container');
    this.progressBarContainer.style.backgroundColor = Util.computeContrastColor(this.params.colorBackground, 0.1);
    descriptionContainer.appendChild(this.progressBarContainer);

    this.progressBar = document.createElement('div');
    this.progressBar.classList.add('h5p-structure-strip-text-strip-progress-bar');
    const hsvValue = Util.computeHSVValue(this.params.colorBackground);
    if (hsvValue > 0.5) {
      this.progressBar.classList.add('h5p-structure-strip-text-strip-progress-bar-pattern-dark');
    }
    else {
      this.progressBar.classList.add('h5p-structure-strip-text-strip-progress-bar-pattern-light');
    }
    this.progressBarContainer.appendChild(this.progressBar);
  }

  /**
   * Add descriptionWrapper.
   * @param {HTMLElement} descriptionContainer Container to add wrapper to.
   */
  addDescriptionWrapper(descriptionContainer) {
    const descriptionWrapper = document.createElement('div');
    descriptionWrapper.classList.add('h5p-structure-strip-text-strip-description-wrapper');

    this.addTitle(descriptionWrapper);

    // Feedback
    if (this.params.feedbackMode === 'whileTyping') {
      this.descriptionStatus = document.createElement('div');
      this.descriptionStatus.classList.add('h5p-structure-strip-text-strip-description-status');
      this.descriptionStatus.innerHTML = '';
      descriptionWrapper.appendChild(this.descriptionStatus);
    }

    descriptionContainer.appendChild(descriptionWrapper);
  }

  /**
   * Add title.
   * @param {HTMLElement} descriptionWrapper Element to add title to.
   */
  addTitle(descriptionWrapper) {
    // Title
    const descriptionTitle = document.createElement('div');
    descriptionTitle.classList.add('h5p-structure-strip-text-strip-description-title');
    descriptionWrapper.appendChild(descriptionTitle);

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
  }

  /**
   * Add input field to content.
   */
  addInputField() {
    const input = document.createElement('div');
    input.classList.add('h5p-structure-strip-text-strip-input-container');

    this.inputField = document.createElement('textarea');
    this.inputField.classList.add('h5p-structure-strip-text-strip-input-field');
    this.inputField.setAttribute('rows', 5);
    this.inputField.setAttribute('aria-label', this.buildAriaLabel([this.params.title]));
    this.inputField.value = this.params.text;
    this.lastValue = this.params.text;

    // Trigger xAPI 'interacted'
    this.inputField.addEventListener('blur', () => {
      if (this.inputField.value !== this.lastValue) {
        this.callbacks.onInteracted();
      }
      this.lastValue = this.inputField.value;
    });

    // Add listeners if feedback should be given while typing
    if (this.params.feedbackMode === 'whileTyping') {
      ['change', 'keyup', 'paste'].forEach((event) => {
        this.inputField.addEventListener(event, this.callbacks.onContentChanged);
      });

      this.inputField.addEventListener('focus', () => {
        this.inputField.setAttribute('aria-label', this.buildAriaLabel([this.params.title, this.descriptionStatus.innerHTML]));
      });
    }

    input.appendChild(this.inputField);

    this.content.appendChild(input);
  }

  /**
   * Set progress bar.
   * @param {number} [progress] 0-100 for regular status, > 100 for exceeded.
   */
  setProgressBar(progress) {
    if (typeof progress !== 'number' || !this.progressBar) {
      return;
    }

    if (progress > 100) {
      this.progressBar.classList.add('h5p-structure-strip-text-strip-progress-bar-pattern-exceeded');
    }
    else {
      this.progressBar.classList.remove('h5p-structure-strip-text-strip-progress-bar-pattern-exceeded');
    }

    this.progressBar.style.width = `${Math.min(Math.max(0, progress), 100)}%`;
  }

  /**
   * Build aria label.
   * @param {string[]} [texts] Texts.
   * @returns {string} Aria label.
   */
  buildAriaLabel(texts = []) {
    return texts
      .map((text) => {
        text = Util.htmlDecode(text);
        return (text.slice(-1) === '.') ? text.slice(0, -1) : text;
      }).join('. ');
  }
}
