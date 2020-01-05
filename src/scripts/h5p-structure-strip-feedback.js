import Util from './h5p-structure-strip-util';

/** Class representing the content */
export default class StructureStripFeedback {
  /**
   * @constructor
   * @param {object} params Parameters.
   */
  constructor(params) {
    this.params = Util.extend(
      {
        text: '',
        title: 'Feedback'
      },
      params
    );

    this.content = document.createElement('div');
    this.content.classList.add('h5p-structure-strip-feedback-container');
    this.content.classList.add('h5p-structure-strip-display-none');

    const feedbackTitle = document.createElement('div');
    feedbackTitle.classList.add('h5p-structure-strip-feedback-title');
    feedbackTitle.innerHTML = Util.htmlDecode(this.params.title);
    this.content.appendChild(feedbackTitle);

    this.feedbackText = document.createElement('div');
    this.feedbackText.classList.add('h5p-structure-strip-feedback-text');
    this.content.appendChild(this.feedbackText);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Get text.
   * @return {string} Text.
   */
  getText() {
    return this.feedbackText.innerHTML; // TODO: Strip HTML
  }

  /**
   * Set text.
   * @param {string} text Text.
   */
  setText(text) {
    this.feedbackText.innerHTML = text;
  }

  /**
   * Get title.
   * @return {string} Title.
   */
  getTitle() {
    return this.params.title;
  }

  /**
   * Show feedback.
   */
  show() {
    this.content.classList.remove('h5p-structure-strip-display-none');
  }

  /**
   * Hide feedback.
   */
  hide() {
    this.content.classList.add('h5p-structure-strip-display-none');
  }
}
