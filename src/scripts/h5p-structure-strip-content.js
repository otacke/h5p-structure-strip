import StructureStripFeedback from './h5p-structure-strip-feedback';
import StructureStripSegment from './h5p-structure-strip-segment';
import Util from './h5p-structure-strip-util';

/** Class representing the content */
export default class StructureStripContent {
  /**
   * @constructor
   * @param {object} params Parameters.
   */
  constructor(params) {
    this.params = Util.extend({
      segments: [],
      slack: 10
    }, params);

    this.segments = [];

    this.content = document.createElement('div');
    this.content.classList.add('h5p-structure-strip-content');

    if (this.params.taskDescription) {
      const taskDescription = document.createElement('div');
      taskDescription.classList.add('h5p-structure-strip-task-description');
      taskDescription.innerHTML = this.params.taskDescription;
      this.content.appendChild(taskDescription);
    }

    const stripsContainer = document.createElement('div');
    stripsContainer.classList.add('h5p-structure-strip-text-strips-container');
    this.content.appendChild(stripsContainer);

    // Build strips
    this.params.segments.forEach((segment, index) => {
      const instanceSegment = new StructureStripSegment({
        callbackContentChanged: () => {
          this.updateSegments();
        },
        colorBackground: segment.colorBackground,
        colorText: segment.colorText,
        description: segment.description,
        feedbackMode: this.params.feedbackMode,
        text: (this.params.previousState.texts) ? this.params.previousState.texts[index] : '',
        title: segment.title || '',
        weight: segment.weight
      });
      this.segments.push(instanceSegment);
      stripsContainer.appendChild(instanceSegment.getDOM());
    });

    if (this.params.feedbackMode === 'onDemand') {
      // Build feedback
      this.feedback = new StructureStripFeedback({
        title: 'Feedback'
      });
      this.content.appendChild(this.feedback.getDOM());
    }

    // Determine reference segment
    this.mostImportantSegment = this.segments.reduce( (previous, current) => {
      if (!previous) {
        return current;
      }
      return (current.getWeight() > previous.getWeight()) ? current : previous;
    });

    this.greatestCommonDivisor = Util.greatestCommonDivisorArray(this.segments.map(segment => segment.getWeight()));

    if (this.params.feedbackMode === 'continuously') {
      this.updateSegments();
    }
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Return the text of all strips.
   * @return {object[]} Texts of all strips.
   */
  getText(concatenated = false) {
    const texts = this.segments.map( strip => strip.getText());
    return concatenated ? texts.join('\n') : texts;
  }

  /**
   * Hide feedback.
   */
  hideFeedback() {
    if (this.params.feedbackMode !== 'onDemand') {
      return;
    }
    this.feedback.hide();
  }

  /**
   * Enable segments.
   */
  enableSegments() {
    this.segments.forEach(segment => {
      segment.enable();
    });
  }

  /**
   * Update segments' status.
   * TODO: Only update all segments if reference segment was changed.
   */
  updateSegments() {
    if (this.params.feedbackMode !== 'continuously') {
      return;
    }

    const referenceLength = this.mostImportantSegment.getText().length / this.mostImportantSegment.getWeight();

    this.segments.forEach(segment => {
      const normalizedLength = segment.getText().length / segment.getWeight();
      if (normalizedLength > referenceLength * (1 + this.params.slack / 100)) {
        segment.setStatus(this.params.l10n.tooLong);
      }
      else if (
        segment.getText().length < segment.getWeight() / this.greatestCommonDivisor ||
          normalizedLength < referenceLength * (1 - this.params.slack / 100)
      ) {
        segment.setStatus(this.params.l10n.tooShort);
      }
      else {
        segment.setStatus('&nbsp;');
      }
    });
  }

  /**
   * Check answer.
   */
  checkAnswer() {
    if (this.params.feedbackMode !== 'onDemand') {
      return;
    }

    const referenceLength = this.mostImportantSegment.getText().length / this.mostImportantSegment.getWeight();

    const feedbackTexts = [];
    this.segments.forEach(segment => {
      const normalizedLength = segment.getText().length / segment.getWeight();
      if (normalizedLength > referenceLength * (1 + this.params.slack / 100)) {
        feedbackTexts.push(this.params.l10n.segmentTooLong.replace(/@title/g, segment.getTitle()));
      }
      if (
        segment.getText().length < segment.getWeight() / this.greatestCommonDivisor ||
          normalizedLength < referenceLength * (1 - this.params.slack / 100)
      ) {
        feedbackTexts.push(this.params.l10n.segmentTooShort.replace(/@title/g, segment.getTitle()));
      }
    });

    if (feedbackTexts.length === 0) {
      feedbackTexts.push(this.params.l10n.allSegmentsGood);
    }

    // Compute feedback text HTML
    let feedbackTextHTML = '';
    if (feedbackTexts.length === 1) {
      feedbackTextHTML = `<p>${feedbackTexts[0]}</p>`;
    }
    else {
      feedbackTextHTML = `<ul>${
        feedbackTexts.reduce((previous, current) => `${previous}<li>${current}</li>`, '')
      }</ul>`;
    }

    this.feedback.setText(feedbackTextHTML);
    this.feedback.show();

    this.segments.forEach(segment => {
      segment.disable();
    });
  }
}
