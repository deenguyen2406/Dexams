/* ============================================
   EXAM-ENGINE.JS — Exam session management
   ============================================ */

window.Dexams = window.Dexams || {};

(function () {
  'use strict';

  /**
   * ExamEngine manages the state of an in-progress exam:
   * timer, answers, navigation, marked questions, auto-save.
   */
  class ExamEngine {
    /**
     * @param {object} exam - The full exam object
     * @param {object} config - { timeMinutes, shuffle, questionCount }
     */
    constructor(exam, config) {
      this.exam = exam;
      this.config = config;
      this.questions = this._prepareQuestions();
      this.answers = new Array(this.questions.length).fill(null);
      this.marked = new Set();
      this.currentIndex = 0;
      this.totalTime = config.timeMinutes * 60; // seconds
      this.timeRemaining = this.totalTime;
      this.timer = null;
      this.startTime = null;
      this.isFinished = false;

      // Callbacks
      this.onTimerUpdate = null;  // (timeRemaining, totalTime)
      this.onTimeUp = null;       // ()
    }

    /* ---- Internal ---- */

    _prepareQuestions() {
      let questions = [...this.exam.questions];
      if (this.config.shuffle) {
        questions = this._shuffle(questions);
      }
      const count = this.config.questionCount || questions.length;
      if (count < questions.length) {
        questions = questions.slice(0, count);
      }
      return questions;
    }

    _shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    /* ---- Timer ---- */

    start() {
      this.startTime = Date.now();
      this.isPaused = false;
      this._startInterval();
      this._saveProgress();
    }

    _startInterval() {
      this.timer = setInterval(() => {
        this.timeRemaining = Math.max(0, this.timeRemaining - 1);
        if (this.onTimerUpdate) {
          this.onTimerUpdate(this.timeRemaining, this.totalTime);
        }
        if (this.timeRemaining <= 0) {
          this._autoSubmit();
        }
        // Auto-save every 10 seconds
        if (this.timeRemaining % 10 === 0) {
          this._saveProgress();
        }
      }, 1000);
    }

    pause() {
      if (this.timer && !this.isFinished) {
        clearInterval(this.timer);
        this.timer = null;
        this.isPaused = true;
        this._saveProgress();
      }
    }

    resume() {
      if (!this.timer && !this.isFinished && this.isPaused) {
        this.isPaused = false;
        this._startInterval();
      }
    }

    _autoSubmit() {
      if (this.onTimeUp) {
        this.onTimeUp();
      }
    }

    /* ---- Navigation ---- */

    getCurrentQuestion() {
      return this.questions[this.currentIndex];
    }

    goToQuestion(index) {
      if (index >= 0 && index < this.questions.length) {
        this.currentIndex = index;
      }
    }

    next() {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++;
        return true;
      }
      return false;
    }

    prev() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        return true;
      }
      return false;
    }

    /* ---- Answers ---- */

    selectAnswer(questionIndex, answerIndex) {
      const q = this.questions[questionIndex];
      if (!q) return;

      if (q.type === 'multiple') {
        // Toggle answer in array
        let current = this.answers[questionIndex];
        if (!Array.isArray(current)) {
          current = [];
        }
        const pos = current.indexOf(answerIndex);
        if (pos >= 0) {
          current.splice(pos, 1);
        } else {
          current.push(answerIndex);
        }
        this.answers[questionIndex] = current.length > 0 ? [...current] : null;
      } else {
        // Single choice or True/False: toggle or set
        if (this.answers[questionIndex] === answerIndex) {
          this.answers[questionIndex] = null; // deselect
        } else {
          this.answers[questionIndex] = answerIndex;
        }
      }
      this._saveProgress();
    }

    getAnswer(questionIndex) {
      return this.answers[questionIndex];
    }

    isAnswered(questionIndex) {
      const a = this.answers[questionIndex];
      if (a === null || a === undefined) return false;
      if (Array.isArray(a) && a.length === 0) return false;
      return true;
    }

    /* ---- Marking ---- */

    toggleMark(questionIndex) {
      if (this.marked.has(questionIndex)) {
        this.marked.delete(questionIndex);
      } else {
        this.marked.add(questionIndex);
      }
      this._saveProgress();
    }

    isMarked(questionIndex) {
      return this.marked.has(questionIndex);
    }

    /* ---- Progress ---- */

    getProgress() {
      let answered = 0;
      this.answers.forEach(a => {
        if (a !== null && !(Array.isArray(a) && a.length === 0)) {
          answered++;
        }
      });
      return {
        answered,
        total: this.questions.length,
        marked: this.marked.size
      };
    }

    /* ---- Submit ---- */

    submit() {
      if (this.isFinished) return null;
      this.isFinished = true;
      if (this.timer) clearInterval(this.timer);

      const elapsed = this.totalTime - this.timeRemaining;

      // Clear saved progress
      Dexams.ProgressStorage.clear();

      return {
        examId: this.exam.id,
        examTitle: this.exam.title,
        questions: this.questions,
        answers: this.answers,
        timeSpent: elapsed,
        timeLimit: this.totalTime,
        config: this.config,
        submittedAt: new Date().toISOString()
      };
    }

    destroy() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    /* ---- Auto-Save ---- */

    _saveProgress() {
      Dexams.ProgressStorage.save({
        examId: this.exam.id,
        answers: this.answers,
        marked: [...this.marked],
        currentIndex: this.currentIndex,
        timeRemaining: this.timeRemaining,
        config: this.config,
        startTime: this.startTime
      });
    }

    /* ---- Restore ---- */

    static canRestore(examId) {
      const progress = Dexams.ProgressStorage.get();
      return progress && progress.examId === examId;
    }

    restore(progress) {
      if (progress.answers) this.answers = progress.answers;
      if (progress.marked) this.marked = new Set(progress.marked);
      if (progress.currentIndex !== undefined) this.currentIndex = progress.currentIndex;
      if (progress.timeRemaining !== undefined) this.timeRemaining = progress.timeRemaining;
      if (progress.startTime) this.startTime = progress.startTime;
    }

    /* ---- Format Helpers ---- */

    static formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  /* ---------- Export ---------- */
  window.Dexams.ExamEngine = ExamEngine;
})();
