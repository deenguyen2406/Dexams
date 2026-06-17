/* ============================================
   STORAGE.JS — Dexams Firebase Manager
   ============================================ */

window.Dexams = window.Dexams || {};

(function () {
  'use strict';

  // Constants for LocalStorage Fallbacks
  const EXAM_KEY = 'dexams_exams';
  const HISTORY_KEY = 'dexams_history';
  const SETTINGS_KEY = 'dexams_settings';
  const VOCAB_KEY = 'dexams_vocab';

  /* ---------- Utility ---------- */
  function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  // --- Local Fallbacks ---
  function safeGetLocal(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`[Storage] Error reading local ${key}:`, e);
      return fallback;
    }
  }

  function safeSetLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[Storage] Error writing local ${key}:`, e);
      return false;
    }
  }

  // --- Firebase Helpers ---
  function getDb() {
    return window.firebaseDb || null;
  }

  /* ---------- Exam Storage ---------- */
  const ExamStorage = {
    async getAll() {
      const db = getDb();
      if (!db) return safeGetLocal(EXAM_KEY, []);
      try {
        const snapshot = await db.ref('exams').once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
      } catch (err) {
        console.error("Firebase get exams error:", err);
        return safeGetLocal(EXAM_KEY, []);
      }
    },

    async getById(id) {
      const all = await this.getAll();
      return all.find(e => e.id === id) || null;
    },

    async save(exam) {
      if (!exam.id) exam.id = generateId();
      if (!exam.createdAt) exam.createdAt = new Date().toISOString();
      exam.updatedAt = new Date().toISOString();
      exam.totalQuestions = exam.questions ? exam.questions.length : 0;

      const db = getDb();
      if (db) {
        try {
          await db.ref('exams/' + exam.id).set(exam);
        } catch (err) {
          console.error("Firebase save exam error:", err);
        }
      }
      
      // Fallback local save as well for offline cache
      const exams = safeGetLocal(EXAM_KEY, []);
      const index = exams.findIndex(e => e.id === exam.id);
      if (index >= 0) exams[index] = exam;
      else exams.push(exam);
      return safeSetLocal(EXAM_KEY, exams);
    },

    async delete(id) {
      const db = getDb();
      if (db) {
        try {
          await db.ref('exams/' + id).remove();
        } catch (err) {
          console.error("Firebase delete exam error:", err);
        }
      }
      const exams = safeGetLocal(EXAM_KEY, []).filter(e => e.id !== id);
      return safeSetLocal(EXAM_KEY, exams);
    },

    async count() {
      const all = await this.getAll();
      return all.length;
    }
  };

  /* ---------- History Storage ---------- */
  const HistoryStorage = {
    async getAll() {
      const db = getDb();
      if (!db) return safeGetLocal(HISTORY_KEY, []);
      try {
        const snapshot = await db.ref('history').once('value');
        const data = snapshot.val();
        if (!data) return [];
        return Object.values(data).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      } catch (err) {
        console.error("Firebase get history error:", err);
        return safeGetLocal(HISTORY_KEY, []);
      }
    },

    async getById(id) {
      const all = await this.getAll();
      return all.find(r => r.id === id) || null;
    },

    async getByExamId(examId) {
      const all = await this.getAll();
      return all.filter(r => r.examId === examId);
    },

    async save(result) {
      if (!result.id) result.id = generateId();
      if (!result.submittedAt) result.submittedAt = new Date().toISOString();
      
      const db = getDb();
      if (db) {
        try {
          await db.ref('history/' + result.id).set(result);
        } catch (err) {
          console.error("Firebase save history error:", err);
        }
      }

      const history = safeGetLocal(HISTORY_KEY, []);
      history.unshift(result);
      return safeSetLocal(HISTORY_KEY, history);
    },

    async delete(id) {
      const db = getDb();
      if (db) {
        try {
          await db.ref('history/' + id).remove();
        } catch (err) {
          console.error("Firebase delete history error:", err);
        }
      }
      const history = safeGetLocal(HISTORY_KEY, []).filter(r => r.id !== id);
      return safeSetLocal(HISTORY_KEY, history);
    },

    async count() {
      const all = await this.getAll();
      return all.length;
    },

    async getAverageScore() {
      const all = await this.getAll();
      if (all.length === 0) return 0;
      const sum = all.reduce((s, r) => s + (r.score || 0), 0);
      return Math.round((sum / all.length) * 100) / 100;
    },

    async getBestScore(examId) {
      const results = examId ? await this.getByExamId(examId) : await this.getAll();
      if (results.length === 0) return 0;
      return Math.max(...results.map(r => r.score || 0));
    },

    async clear() {
      const db = getDb();
      if (db) {
        try {
          await db.ref('history').remove();
        } catch (err) {}
      }
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  /* ---------- Settings Storage ---------- */
  const SettingsStorage = {
    async get(key, defaultValue) {
      const settings = await this.getAll();
      return settings[key] !== undefined ? settings[key] : defaultValue;
    },

    async set(key, value) {
      const db = getDb();
      if (db) {
        try {
          await db.ref('settings/' + key).set(value);
        } catch(e) {}
      }
      const settings = safeGetLocal(SETTINGS_KEY, {});
      settings[key] = value;
      return safeSetLocal(SETTINGS_KEY, settings);
    },

    async getAll() {
      const db = getDb();
      if (!db) return safeGetLocal(SETTINGS_KEY, {});
      try {
        const snapshot = await db.ref('settings').once('value');
        return snapshot.val() || safeGetLocal(SETTINGS_KEY, {});
      } catch (err) {
        return safeGetLocal(SETTINGS_KEY, {});
      }
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

  /* ---------- Vocabulary Storage ---------- */
  const VocabStorage = {
    async getAll() {
      const db = getDb();
      if (!db) return safeGetLocal(VOCAB_KEY, []);
      try {
        const snapshot = await db.ref('vocab').once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
      } catch (err) {
        console.error('Firebase get vocab error:', err);
        return safeGetLocal(VOCAB_KEY, []);
      }
    },

    async getById(id) {
      const all = await this.getAll();
      return all.find(v => v.id === id) || null;
    },

    async save(vocabSet) {
      if (!vocabSet.id) vocabSet.id = generateId();
      if (!vocabSet.createdAt) vocabSet.createdAt = new Date().toISOString();
      vocabSet.updatedAt = new Date().toISOString();
      vocabSet.totalWords = vocabSet.words ? vocabSet.words.length : 0;

      const db = getDb();
      if (db) {
        try {
          await db.ref('vocab/' + vocabSet.id).set(vocabSet);
        } catch (err) {
          console.error('Firebase save vocab error:', err);
        }
      }

      const list = safeGetLocal(VOCAB_KEY, []);
      const index = list.findIndex(v => v.id === vocabSet.id);
      if (index >= 0) list[index] = vocabSet;
      else list.push(vocabSet);
      return safeSetLocal(VOCAB_KEY, list);
    },

    async delete(id) {
      const db = getDb();
      if (db) {
        try {
          await db.ref('vocab/' + id).remove();
        } catch (err) {
          console.error('Firebase delete vocab error:', err);
        }
      }
      const list = safeGetLocal(VOCAB_KEY, []).filter(v => v.id !== id);
      return safeSetLocal(VOCAB_KEY, list);
    },

    async count() {
      const all = await this.getAll();
      return all.length;
    }
  };

  /* ---------- Export ---------- */
  window.Dexams.ExamStorage = ExamStorage;
  window.Dexams.HistoryStorage = HistoryStorage;
  window.Dexams.SettingsStorage = SettingsStorage;
  window.Dexams.ProgressStorage = ProgressStorage;
  window.Dexams.VocabStorage = VocabStorage;
  window.Dexams.generateId = generateId;
})();

