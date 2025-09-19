import Overlay from '@scripts/h5p-structure-strip-overlay.js';
import StructureStripSection from '@scripts/h5p-structure-strip-section.js';
import Util from '@services/util.js';

/** Class representing the content */
export default class StructureStripContent {
  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = params;

    this.callbacks = Util.extend({
      onInteracted: () => {},
    }, callbacks);

    this.sections = [];

    this.content = document.createElement('div');
    this.content.classList.add('h5p-structure-strip-content');

    // Strips container
    const stripsContainer = document.createElement('div');
    stripsContainer.classList.add('h5p-structure-strip-text-strips-container');
    this.content.appendChild(stripsContainer);

    // Build strips
    this.params.sections.forEach((section, index) => {
      const instanceSection = new StructureStripSection({
        colorBackground: section.colorBackground,
        colorText: section.colorText,
        feedbackMode: this.params.feedbackMode,
        hasDescription: section.description && section.description !== '',
        id: index,
        text: (this.params.previousState.texts) ? this.params.previousState.texts[index] : '',
        title: Util.htmlDecode(section.title || `${this.params.l10n.section} ${index + 1}`),
        weight: section.weight,
        a11y: {
          showHints: this.params.a11y.showHints,
        },
      }, {
        onContentChanged: () => {
          this.updateSections();
        },
        onHintButtonOpened: (id) => {
          // TODO: Put this into create overlay content function
          const hintText = document.createElement('div');
          hintText.innerHTML = this.params.sections[id].description;

          this.overlay.setTitle(Util.htmlDecode(section.title || `${this.params.l10n.section} ${index + 1}`));
          this.overlay.setContent(hintText);
          this.overlay.show();
        },
        onInteracted: () => {
          this.callbacks.onInteracted();
        },
      });
      this.sections.push(instanceSection);
      stripsContainer.appendChild(instanceSection.getDOM());
    });

    // Determine reference section (largest weight)
    this.referenceSection = this.sections.reduce( (previous, current) => {
      if (!previous) {
        return current;
      }
      return (current.getWeight() > previous.getWeight()) ? current : previous;
    });

    // Percentage of reference section
    const sectionsTotalWeight = this.sections.reduce((previous, current) => previous + current.getWeight(), 0);
    this.referenceSectionPercentage = this.referenceSection.getWeight() / sectionsTotalWeight;

    // Maximum text length adjusted for weight and slack mustn't be smaller that minimum text length
    if (this.params.textLengthMax * this.referenceSectionPercentage < this.params.textLengthMin) {
      this.params.textLengthMax = Number.POSITIVE_INFINITY;
    }

    // Greatest common divisor of section weights.
    this.greatestCommonDivisor = Util.greatestCommonDivisorArray(this.sections.map((section) => section.getWeight()));

    if (this.params.feedbackMode === 'whileTyping') {
      this.updateSections();
    }

    // Overlay
    this.overlay = new Overlay(
      {
        container: this.params.container,
        a11y: {
          closeWindow: this.params.a11y.closeWindow,
        },
      },
      {
        onClose: () => {
          this.overlay.hide();
        },
      },
    );
    this.content.appendChild(this.overlay.getDOM());
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Set container.
   * @param {HTMLElement} container Container to set.
   */
  setContainer(container) {
    this.overlay.setContainer(container);
  }

  /**
   * Return the text of all strips.
   * @param {boolean} [concatenated] If true return text concatenated as string.
   * @returns {string|object[]} Texts of all strips.
   */
  getText(concatenated = false) {
    const texts = this.sections.map((strip) => strip.getText());
    return concatenated ? texts.filter((text) => text !== '').join('\n') : texts;
  }

  /**
   * Resize.
   */
  resize() {
    this.overlay.resize();
  }

  /**
   * Enable sections.
   */
  enableSections() {
    this.sections.forEach((section) => {
      section.enable();
    });
  }

  /**
   * Enable sections.
   */
  resetSections() {
    this.sections.forEach((section) => {
      section.reset();
    });
  }

  /**
   * Update sections' status.
   */
  updateSections() {
    if (this.params.feedbackMode !== 'whileTyping') {
      return;
    }

    // Only show feedback if all sections have been filled
    if (this.sections.some((section) => section.getText().length === 0)) {
      this.sections.forEach((section) => {
        section.setStatus('&nbsp;');
        section.setProgressBar(0);
      });

      return;
    }

    // TODO: This handling may be improved ...
    //       Merge buildFeedbackTexts, buildProgress and updating sections
    //       Take care of checkAnswer using buildFeedbackTexts

    // Feedback texts
    const feedbackTexts = this.buildFeedbackTexts({
      tooLong: this.params.l10n.tooLong,
      tooShort: this.params.l10n.tooShort,
    });

    // Progresses
    const progresses = this.buildProgresses();

    this.sections.forEach((section, index) => {
      section.setStatus(feedbackTexts[index] || '&nbsp;');
      section.setProgressBar(progresses[index]);
    });
  }

  /**
   * Compute normed min and max length of text.
   * @returns {object} Min and max length of text.
   */
  computeNormedLengths() {
    let referenceLength =
      Math.max(this.referenceSection.getText().length, this.referenceSection.getWeight() / this.greatestCommonDivisor);

    // Don't use slack for absolute text length minimum/maximum
    let slackPercentage = this.params.slack / 100;
    if (referenceLength < this.params.textLengthMin * this.referenceSectionPercentage) {
      referenceLength = this.params.textLengthMin * this.referenceSectionPercentage;
      slackPercentage = 0;
    }
    if (referenceLength > this.params.textLengthMax * this.referenceSectionPercentage) {
      referenceLength = this.params.textLengthMax * this.referenceSectionPercentage;
      slackPercentage = 0;
    }

    // Use normed values
    const normedReferenceLength = referenceLength / this.referenceSection.getWeight();
    const normedLengthMax = normedReferenceLength * (1 + slackPercentage);
    const normedLengthMin = normedReferenceLength * (1 - slackPercentage);

    return {
      min: normedLengthMin,
      max: normedLengthMax,
    };
  }

  /**
   * Build feedback texts.
   * @param {object} textTemplates Texts.
   * @param {string} textTemplates.alright Text for good section length.
   * @param {string} textTemplates.tooLong Text for section that is too long.
   * @param {string} textTemplates.tooShort Text for section that is too short.
   * @returns {string[]} Feedback texts.
   */
  buildFeedbackTexts(textTemplates) {
    const normedLengths = this.computeNormedLengths();
    const feedbackTexts = [];
    this.sections.forEach((section) => {
      const normedLength = section.getText().length / section.getWeight();

      if (normedLength > normedLengths.max) {

        // Too long compared to reference
        const gap = Math.round((normedLength - normedLengths.max) * section.getWeight());
        if (gap === 0) {
          // Compensate for tiny text lengths
          feedbackTexts.push(null);
        }
        else {
          feedbackTexts.push(
            textTemplates.tooLong.replace(/@title/g, section.getTitle()).replace(/@chars/g, gap),
          );
        }
      }
      else if (normedLength < normedLengths.min) {

        // To short compared to reference
        const gap = Math.round((normedLengths.min - normedLength) * section.getWeight());
        if (gap === 0) {
          // Compensate for tiny text lengths
          feedbackTexts.push(null);
        }
        else {
          feedbackTexts.push(
            textTemplates.tooShort.replace(/@title/g, section.getTitle()).replace(/@chars/g, gap),
          );
        }
      }
      else {

        // Alright
        feedbackTexts.push(textTemplates.alright);
      }
    });

    return feedbackTexts;
  }

  /**
   * Build progress values.
   * @returns {number[]} Progress values.
   */
  buildProgresses() {
    const normedLengths = this.computeNormedLengths();

    return this.sections.map((section) => {
      const normedLength = section.getText().length / section.getWeight();

      if (normedLength > normedLengths.max) {

        const gap = Math.round((normedLength - normedLengths.max) * section.getWeight());
        if (gap === 0) {
          return 100;
        }

        return (normedLength / normedLengths.max) * 100;
      }
      else if (normedLength < normedLengths.min) {
        const gap = Math.round((normedLengths.min - normedLength) * section.getWeight());
        if (gap === 0) {
          return 100;
        }

        return (normedLength / normedLengths.min) * 100;
      }
      else {
        return 100;
      }
    });
  }

  /**
   * Check answer.
   * @returns {string|undefined} HTMl feedback.
   */
  checkAnswer() {
    if (this.params.feedbackMode !== 'onRequest') {
      return;
    }

    this.sections.forEach((section) => {
      section.disable();
    });

    let feedbackTexts = this.buildFeedbackTexts({
      alright: null,
      tooLong: this.params.l10n.sectionTooLong,
      tooShort: this.params.l10n.sectionTooShort,
    });

    // Remove empty feedback
    feedbackTexts = feedbackTexts.filter((text) => text !== null);
    if (feedbackTexts.length === 0) {
      feedbackTexts = [this.params.l10n.allSectionsGood];
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

    return feedbackTextHTML;
  }
}
