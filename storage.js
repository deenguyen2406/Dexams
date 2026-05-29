/* ============================================
   STORAGE.JS — Dexams localStorage Manager
   ============================================ */

window.Dexams = window.Dexams || {};

(function () {
  'use strict';

  const EXAM_KEY = 'dexams_exams';
  const HISTORY_KEY = 'dexams_history';
  const SETTINGS_KEY = 'dexams_settings';

  /* ---------- Utility ---------- */
  function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function safeGet(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`[Storage] Error reading ${key}:`, e);
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[Storage] Error writing ${key}:`, e);
      return false;
    }
  }

  /* ---------- Exam Storage ---------- */
  const ExamStorage = {
    getAll() {
      return safeGet(EXAM_KEY, []);
    },

    getById(id) {
      return this.getAll().find(e => e.id === id) || null;
    },

    save(exam) {
      if (!exam.id) exam.id = generateId();
      if (!exam.createdAt) exam.createdAt = new Date().toISOString();
      exam.updatedAt = new Date().toISOString();
      exam.totalQuestions = exam.questions ? exam.questions.length : 0;

      const exams = this.getAll();
      const index = exams.findIndex(e => e.id === exam.id);
      if (index >= 0) {
        exams[index] = exam;
      } else {
        exams.push(exam);
      }
      return safeSet(EXAM_KEY, exams);
    },

    delete(id) {
      const exams = this.getAll().filter(e => e.id !== id);
      return safeSet(EXAM_KEY, exams);
    },

    count() {
      return this.getAll().length;
    },

    clear() {
      localStorage.removeItem(EXAM_KEY);
    }
  };

  /* ---------- History Storage ---------- */
  const HistoryStorage = {
    getAll() {
      return safeGet(HISTORY_KEY, []);
    },

    getById(id) {
      return this.getAll().find(r => r.id === id) || null;
    },

    getByExamId(examId) {
      return this.getAll().filter(r => r.examId === examId);
    },

    save(result) {
      if (!result.id) result.id = generateId();
      if (!result.submittedAt) result.submittedAt = new Date().toISOString();
      const history = this.getAll();
      history.unshift(result);
      return safeSet(HISTORY_KEY, history);
    },

    delete(id) {
      const history = this.getAll().filter(r => r.id !== id);
      return safeSet(HISTORY_KEY, history);
    },

    count() {
      return this.getAll().length;
    },

    getAverageScore() {
      const all = this.getAll();
      if (all.length === 0) return 0;
      const sum = all.reduce((s, r) => s + (r.score || 0), 0);
      return Math.round((sum / all.length) * 100) / 100;
    },

    getBestScore(examId) {
      const results = examId ? this.getByExamId(examId) : this.getAll();
      if (results.length === 0) return 0;
      return Math.max(...results.map(r => r.score || 0));
    },

    clear() {
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  /* ---------- Settings Storage ---------- */
  const SettingsStorage = {
    get(key, defaultValue) {
      const settings = safeGet(SETTINGS_KEY, {});
      return settings[key] !== undefined ? settings[key] : defaultValue;
    },

    set(key, value) {
      const settings = safeGet(SETTINGS_KEY, {});
      settings[key] = value;
      return safeSet(SETTINGS_KEY, settings);
    },

    getAll() {
      return safeGet(SETTINGS_KEY, {});
    }
  };

  /* ---------- Session Progress (for exam recovery) ---------- */
  const ProgressStorage = {
    save(progress) {
      try {
        sessionStorage.setItem('dexams_progress', JSON.stringify(progress));
      } catch (e) {
        console.error('[Storage] Error saving progress:', e);
      }
    },

    get() {
      try {
        const data = sessionStorage.getItem('dexams_progress');
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    },

    clear() {
      sessionStorage.removeItem('dexams_progress');
    }
  };

  /* ---------- Export ---------- */
  window.Dexams.ExamStorage = ExamStorage;
  window.Dexams.HistoryStorage = HistoryStorage;
  window.Dexams.SettingsStorage = SettingsStorage;
  window.Dexams.ProgressStorage = ProgressStorage;
  window.Dexams.generateId = generateId;
})();
