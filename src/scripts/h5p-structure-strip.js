// Import required classes
import StructureStripContent from './h5p-structure-strip-content';
import Util from './h5p-structure-strip-util';

/**
 * Class holding structure strip.
 */
export default class StructureStrip extends H5P.Question {
  /**
   * @constructor
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
      segments: [],
      behaviour: {
        enableSolutionsButton: true,
        enableRetry: true,
        slack: 10,
        textLengthMin: 0,
        textLengthMax: Number.POSITIVE_INFINITY,
        feedbackMode: 'continuously'
      },
      l10n: {
        checkAnswer: 'Check answer',
        copy: 'Copy',
        showSolution: 'Show solution',
        tryAgain: 'Retry',
        allSegmentsGood: 'Your sections\' lenghts are all fine.',
        segmentTooShort: 'Your @title is too short.',
        segmentTooLong: 'Your @title is too long.',
        tooShort: 'too short',
        tooLong: 'too long',
        copyToClipboardError: 'Your text could not be copied to the clipboard.',
        copyToClipboardSuccess: 'Your text was copied to the clipboard.'
      },
      a11y: {
        copyToClipboard: 'Copy your text to the clipboard.',
        feedback: 'Feedback'
      }
    }, params);
    this.contentId = contentId;
    this.extras = extras;

    // this.previousState now holds the saved content state of the previous session
    this.previousState = this.extras.previousState || {};

    /**
     * Register the DOM elements with H5P.Question
     */
    this.registerDomElements = () => {
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
              title: media.params.title
            });
          }
        }
        // Video
        else if (type === 'H5P.Video') {
          if (media.params.sources) {
            this.setVideo(media);
          }
        }
      }

      this.content = new StructureStripContent(
        {
          feedbackMode: this.params.behaviour.feedbackMode,
          l10n: {
            allSegmentsGood: this.params.l10n.allSegmentsGood,
            segmentTooShort: this.params.l10n.segmentTooShort,
            segmentTooLong: this.params.l10n.segmentTooLong,
            tooShort: this.params.l10n.tooShort,
            tooLong: this.params.l10n.tooLong
          },
          previousState: this.previousState,
          segments: this.params.segments,
          slack: this.params.behaviour.slack,
          taskDescription: this.params.taskDescription,
          textLengthMax: this.params.behaviour.textLengthMax,
          textLengthMin: this.params.behaviour.textLengthMin
        }
      );

      // Register content with H5P.Question
      this.setContent(this.content.getDOM());

      // Register Buttons
      this.addButtons();

      /*
       * H5P.Question also offers some more functions that could be used.
       * Consult https://github.com/h5p/h5p-question for details
       */
    };

    /**
     * Add all the buttons that shall be passed to H5P.Question.
     */
    this.addButtons = () => {
      // Show solution button
      this.addButton('show-solution', this.params.l10n.showSolution, () => {
        // TODO: Implement something useful to do on click
      }, false, {}, {});

      if (this.params.behaviour.feedbackMode === 'onRequest') {
        // Check answer button
        this.addButton('check-answer', this.params.l10n.checkAnswer, () => {
          const feedback = this.content.checkAnswer();
          this.setFeedback(
            feedback,
            null,
            null,
            this.params.a11y.feedback
          );

          this.hideButton('check-answer');

          if (this.params.behaviour.enableRetry) {
            this.showButton('try-again');
          }
        }, true, {}, {});
      }

      // Retry button
      this.addButton('try-again', this.params.l10n.tryAgain, () => {
        this.removeFeedback();
        this.showButton('check-answer');
        this.hideButton('try-again');

        this.resetTask();

        this.trigger('resize');
      }, false, {}, {});

      // Copy to clipboard button
      this.addButton('copy', this.params.l10n.copy, () => {
        const text = this.content.getText(true);
        Util.copyTextToClipboard(text, (result) => {
          const button = document.querySelector('.h5p-question-copy');
          const message = (result === true) ? this.params.l10n.copyToClipboardSuccess : this.params.a11y.copyToClipboardError;
          this.read(message);
          H5P.attachToastTo(button, message, {position: {
            horizontal: 'after',
            noOverflowRight: true,
            offsetHorizontal: 10,
            offsetVertical: -5,
            vertical: 'centered'
          }});
        });
      }, true, {'aria-label': this.params.l10n.copyToClipboard}, {});
    };

    /**
     * Check if result has been submitted or input has been given.
     * @return {boolean} True, if answer was given.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
     */
    this.getAnswerGiven = () => false; // TODO: Return your value here

    /**
     * Get latest score.
     * @return {number} latest score.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
     */
    this.getScore = () => 0; // TODO: Return real score here

    /**
     * Get maximum possible score.
     * @return {number} Score necessary for mastering.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
     */
    this.getMaxScore = () => 0; // TODO: Return real maximum score here

    /**
     * Show solutions.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
     */
    this.showSolutions = () => {
      // TODO: Implement showing the solutions

      this.trigger('resize');
    };

    /**
     * Reset task.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
     */
    this.resetTask = () => {
      this.content.enableSegments();
    };

    /**
     * Get xAPI data.
     * @return {object} XAPI statement.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
     */
    this.getXAPIData = () => ({
      statement: this.getXAPIAnswerEvent().data.statement
    });

    /**
     * Build xAPI answer event.
     * @return {H5P.XAPIEvent} XAPI answer event.
     */
    this.getXAPIAnswerEvent = () => {
      const xAPIEvent = this.createXAPIEvent('answered');

      xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this,
        true, this.isPassed());

      /*
       * TODO: Add other properties here as required, e.g. xAPIEvent.data.statement.result.response
       * https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#245-result
       */

      return xAPIEvent;
    };

    /**
     * Create an xAPI event for StructureStrip.
     * @param {string} verb Short id of the verb we want to trigger.
     * @return {H5P.XAPIEvent} Event template.
     */
    this.createXAPIEvent = (verb) => {
      const xAPIEvent = this.createXAPIEventTemplate(verb);
      Util.extend(
        xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
        this.getxAPIDefinition());
      return xAPIEvent;
    };

    /**
     * Get the xAPI definition for the xAPI object.
     * @return {object} XAPI definition.
     */
    this.getxAPIDefinition = () => {
      const definition = {};
      definition.name = {'en-US': this.getTitle()};
      definition.description = {'en-US': this.getDescription()};

      // TODO: Set IRI as required for your verb, cmp. http://xapi.vocab.pub/verbs/#
      definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';

      // TODO: Set as required, cmp. https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#interaction-types
      definition.interactionType = 'other';

      /*
       * TODO: Add other object properties as required, e.g. definition.correctResponsesPattern
       * cmp. https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#244-object
       */

      return definition;
    };

    /**
     * Determine whether the task has been passed by the user.
     * @return {boolean} True if user passed or task is not scored.
     */
    this.isPassed = () => true;

    /**
     * Get task title.
     * @return {string} Title.
     */
    this.getTitle = () => {
      let raw;
      if (this.extras.metadata) {
        raw = this.extras.metadata.title;
      }
      raw = raw || StructureStrip.DEFAULT_DESCRIPTION;

      // H5P Core function: createTitle
      return H5P.createTitle(raw);
    };

    /**
     * Get task description.
     * @return {string} Description.
     */
    this.getDescription = () => this.params.taskDescription || StructureStrip.DEFAULT_DESCRIPTION;

    /**
     * Answer call to return the current state.
     * @return {object} Current state.
     */
    this.getCurrentState = () => {
      // TODO: Don't let minor changes by author reset the task
      return {
        texts: this.content.getText()
      };
    };
  }
}

/** @constant {string} */
StructureStrip.DEFAULT_DESCRIPTION = 'Structure Strip';
