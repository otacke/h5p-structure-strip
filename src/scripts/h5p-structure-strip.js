// Import required classes
import StructureStripContent from '@scripts/h5p-structure-strip-content.js';
import Util from '@services/util.js';

/**
 * Class holding structure strip.
 */
export default class StructureStrip extends H5P.Question {
  /**
   * @class
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super('structure-strip');

    /*
     * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry
     * are used by H5P's question type contract.
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
     */

    // Make sure all variables are set
    this.params = Util.extend({
      media: {},
      sections: [],
      behaviour: {
        enableSolutionsButton: true,
        enableRetry: true,
        slack: 10,
        textLengthMin: 0,
        textLengthMax: Number.POSITIVE_INFINITY,
        feedbackMode: 'whileTyping',
      },
      l10n: {
        checkAnswer: 'Check answer',
        copy: 'Copy',
        showSolution: 'Show solution',
        tryAgain: 'Retry',
        allSectionsGood: 'Your sections\' lenghts are all fine.',
        sectionTooShort: 'Your @title is too short. You need at least @char more characters.',
        sectionTooLong: 'Your @title is too long. Remove at least @chars characters.',
        tooShort: '@chars characters too short',
        tooLong: '@chars characters too long',
        copyToClipboardError: 'Your text could not be copied to the clipboard',
        copyToClipboardSuccess: 'Your text was copied to the clipboard',
        section: 'Section',
        messageNoSection: 'There was no section given for this structure strip.',
      },
      a11y: {
        copyToClipboard: 'Copy text to clipboard',
        feedback: 'Feedback',
        closeWindow: 'Close window',
      },
    }, params);

    // Decode a11y labels
    for (let item in this.params.a11y) {
      this.params.a11y[item] = Util.htmlDecode(this.params.a11y[item]);
    }

    this.contentId = contentId;
    this.extras = extras;

    const defaultLanguage = (this.extras && this.extras.metadata) ? this.extras.metadata.defaultLanguage || 'en' : 'en';
    this.languageTag = Util.formatLanguageCode(defaultLanguage);

    // this.previousState now holds the saved content state of the previous session
    this.previousState = this.extras.previousState || {};
  }

  /**
   * Register the DOM elements with H5P.Question
   */
  registerDomElements() {
    // Set optional media
    const media = this.params.media.type;
    if (media && media.library) {
      const type = media.library.split(' ')[0];
      // Image
      if (type === 'H5P.Image') {
        if (media.params.file) {
          this.setImage(media.params.file.path, {
            disableImageZooming: this.params.media.disableImageZooming,
            alt: media.params.alt,
            title: media.params.title,
            expandImage: media.params.expandImage,
            minimizeImage: media.params.minimizeImage,
          });
        }
      }
      // Video
      else if (type === 'H5P.Video') {
        if (media.params.sources) {
          this.setVideo(media);
        }
      }
      // Audio
      else if (type === 'H5P.Audio') {
        if (media.params.files) {
          this.setAudio(media);
        }
      }
    }

    // No section set in editor
    if (this.params.sections.length === 0) {
      const message = document.createElement('div');
      message.classList.add('h5p-structure-strip-message');
      message.innerText = this.params.l10n.messageNoSection;
      this.setContent(message);
      return;
    }

    // Register task introduction text
    if (this.params.taskDescription) {
      const introduction = document.createElement('div');
      introduction.classList.add('h5p-structure-strip-task-description');
      introduction.innerHTML = this.params.taskDescription;
      this.setIntroduction(introduction);
    }

    this.content = new StructureStripContent(
      {
        feedbackMode: this.params.behaviour.feedbackMode,
        l10n: {
          allSectionsGood: this.params.l10n.allSectionsGood,
          sectionTooShort: this.params.l10n.sectionTooShort,
          sectionTooLong: this.params.l10n.sectionTooLong,
          tooShort: this.params.l10n.tooShort,
          tooLong: this.params.l10n.tooLong,
          section: this.params.l10n.section,
        },
        a11y: {
          closeWindow: this.params.a11y.closeWindow,
          showHints: this.params.a11y.showHints,
        },
        previousState: this.previousState,
        sections: this.params.sections,
        slack: this.params.behaviour.slack,
        taskDescription: this.params.taskDescription,
        textLengthMax: this.params.behaviour.textLengthMax,
        textLengthMin: this.params.behaviour.textLengthMin,
      },
      {
        onInteracted: () => {
          this.handleInteracted();
        },
      },
    );

    // Register content with H5P.Question
    this.setContent(this.content.getDOM());

    // Register Buttons
    this.addButtons();

    // Wait for content DOM to be completed to handle DOM initialization
    if (document.readyState === 'complete') {
      window.requestAnimationFrame(() => {
        this.handleDOMInitialized();
      });
    }
    else {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
          window.requestAnimationFrame(() => {
            this.handleDOMInitialized();
          });
        }
      });
    }

    this.on('resize', () => {
      this.content.resize();
    });
  }

  /**
   * Add all the buttons that shall be passed to H5P.Question.
   */
  async addButtons() {
    // Show solution button
    this.addButton('show-solution', this.params.l10n.showSolution, () => {
      // TODO: Implement something useful to do on click
    }, false, {}, {});

    // Check answer button
    if (this.params.behaviour.feedbackMode === 'onRequest') {
      this.addButton('check-answer', this.params.l10n.checkAnswer, () => {
        const feedback = this.content.checkAnswer();
        this.setFeedback(
          feedback,
          null,
          null,
          this.params.a11y.feedback,
        );

        this.hideButton('check-answer');

        if (this.params.behaviour.enableRetry) {
          this.showButton('try-again');
        }
      }, true, {}, {});
    }

    // Retry button
    this.addButton('try-again', this.params.l10n.tryAgain, () => {
      this.retry();
    }, false, {}, {});

    /*
     * Only add copy button if browser supports it
     * Firefox doesn't support querying clipboard-write, but it supports
     * clipboard writing in general. The result may not be accurate though.
     */

    let canWriteToClipboard = false;
    try {
      canWriteToClipboard =
        await navigator.permissions.query({ name: 'clipboard-write' });
    }
    catch (error) {
      if (typeof InstallTrigger !== 'undefined') {
        canWriteToClipboard = true;
      }
    }

    if (canWriteToClipboard) {
      // Copy to clipboard button
      this.addButton('copy', this.params.l10n.copy, () => {
        const text = this.content.getText(true);
        Util.copyTextToClipboard(text, (result) => {
          const button = this.buttonCopy;
          const message = (result === true) ?
            this.params.l10n.copyToClipboardSuccess :
            this.params.l10n.copyToClipboardError;

          this.read(message);

          H5P.attachToastTo(button, message, { position: {
            horizontal: 'after',
            noOverflowRight: true,
            offsetHorizontal: 10,
            offsetVertical: -5,
            vertical: 'centered',
          } });
        });
      }, true, { 'aria-label': this.params.l10n.copyToClipboard }, {});
    }
  }

  /**
   * Check if result has been submitted or input has been given.
   * @returns {boolean} True, if answer was given.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
   */
  getAnswerGiven() {
    return false;
  }

  /**
   * Get latest score.
   * @returns {number} latest score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
   */
  getScore() {
    return 0;
  }

  /**
   * Get maximum possible score.
   * @returns {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  getMaxScore() {
    return 0;
  }

  /**
   * Show solutions.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
   */
  showSolutions() {
    // TODO: Implement showing the solutions

    this.trigger('resize');
  }

  /**
   * Retry task.
   * Enable the input fields so the user can modify their content.
   */
  retry() {
    this.removeFeedback();
    this.showButton('check-answer');
    this.hideButton('try-again');

    this.content.enableSections();

    this.trigger('resize');
  }

  /**
   * Reset task.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  resetTask() {
    this.content.resetSections();
    this.retry();
  }

  /**
   * Get xAPI data.
   * @returns {object} XAPI statement.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData() {
    return {
      statement: this.getXAPIAnswerEvent().data.statement,
    };
  }

  /**
   * Build xAPI answer event.
   * @returns {H5P.XAPIEvent} XAPI answer event.
   */
  getXAPIAnswerEvent() {
    const xAPIEvent = this.createXAPIEvent('answered');

    xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this,
      true, this.isPassed());

    /*
     * TODO: Add other properties here as required, e.g. xAPIEvent.data.statement.result.response
     * https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#245-result
     */

    return xAPIEvent;
  }

  /**
   * Create an xAPI event for StructureStrip.
   * @param {string} verb Short id of the verb we want to trigger.
   * @returns {H5P.XAPIEvent} Event template.
   */
  createXAPIEvent(verb) {
    const xAPIEvent = this.createXAPIEventTemplate(verb);
    Util.extend(
      xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
      this.getxAPIDefinition());
    return xAPIEvent;
  }

  /**
   * Get the xAPI definition for the xAPI object.
   * @returns {object} XAPI definition.
   */
  getxAPIDefinition() {
    const definition = {};
    definition.name = {};
    definition.name[this.languageTag] = this.getTitle();
    definition.description = {};
    definition.description[this.languageTag] = this.getDescription();

    // TODO: Set IRI as required for your verb, cmp. http://xapi.vocab.pub/verbs/#
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';

    // TODO: Set as required, cmp. https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#interaction-types
    definition.interactionType = 'other';

    /*
     * TODO: Add other object properties as required, e.g. definition.correctResponsesPattern
     * cmp. https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#244-object
     */

    return definition;
  }

  /**
   * Determine whether the task has been passed by the user.
   * @returns {boolean} True if user passed or task is not scored.
   */
  isPassed() {
    return true;
  }

  /**
   * Get task title.
   * @returns {string} Title.
   */
  getTitle() {
    let raw;
    if (this.extras.metadata) {
      raw = this.extras.metadata.title;
    }
    raw = raw || StructureStrip.DEFAULT_DESCRIPTION;

    // H5P Core function: createTitle
    return H5P.createTitle(raw);
  }

  /**
   * Get task description.
   * @returns {string} Description.
   */
  getDescription() {
    return this.params.taskDescription || StructureStrip.DEFAULT_DESCRIPTION;
  }

  /**
   * Answer call to return the current state.
   * @returns {object} Current state.
   */
  getCurrentState() {
    // TODO: Don't let minor changes by author reset the task
    return {
      texts: this.content.getText(),
    };
  }

  /**
   * Handle DOM initialized.
   */
  handleDOMInitialized() {
    this.container = Util.closestParent(this.content.getDOM(), '.h5p-question.h5p-structure-strip');
    this.buttonCopy = this.container.querySelector('.h5p-question-copy');

    this.content.setContainer(this.container);
  }

  /**
   * Handle user interacted.
   */
  handleInteracted() {
    this.triggerXAPI('interacted');
  }
}

/** @constant {string} */
StructureStrip.DEFAULT_DESCRIPTION = 'Structure Strip';
