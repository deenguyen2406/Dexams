/* ============================================
   SCORER.JS — Score calculation & grading
   ============================================ */

window.Dexams = window.Dexams || {};

(function () {
  'use strict';

  /**
   * Calculate the score for completed exam answers.
   * @param {Array} questions - Array of question objects
   * @param {Array} answers   - Array of user answers (number | number[] | null)
   * @returns {object} - { correct, wrong, skipped, total, score, details[] }
   */
  function calculateScore(questions, answers) {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const details = questions.map((q, i) => {
      const answer = answers[i];
      let isCorrect = false;
      let isSkipped = false;

      // Check if skipped
      if (answer === null || answer === undefined) {
        isSkipped = true;
        skipped++;
      } else if (Array.isArray(answer) && answer.length === 0) {
        isSkipped = true;
        skipped++;
      } else {
        // Evaluate correctness
        if (q.type === 'multiple') {
          const correctSet = new Set(q.correctAnswers || []);
          const answerSet = new Set(Array.isArray(answer) ? answer : [answer]);
          isCorrect = correctSet.size === answerSet.size &&
            [...correctSet].every(a => answerSet.has(a));
        } else {
          // Single choice or True/False
          const correctIdx = q.correctAnswer !== null && q.correctAnswer !== undefined
            ? q.correctAnswer
            : (q.correctAnswers ? q.correctAnswers[0] : 0);
          isCorrect = answer === correctIdx;
        }

        if (isCorrect) correct++;
        else wrong++;
      }

      return {
        index: i,
        question: q,
        answer: answer,
        isCorrect: isCorrect,
        isSkipped: isSkipped
      };
    });

    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 10 * 100) / 100 : 0;

    return {
      correct,
      wrong,
      skipped,
      total,
      score,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      details
    };
  }

  /**
   * Get the grade label and CSS class for a given score (out of 10).
   */
  function getGrade(score, lang) {
    const isVi = lang === 'vi';
    if (score >= 8) {
      return {
        label: isVi ? 'Giỏi' : 'Excellent',
        className: 'grade-excellent',
        emoji: '🏆'
      };
    } else if (score >= 6.5) {
      return {
        label: isVi ? 'Khá' : 'Good',
        className: 'grade-good',
        emoji: '👍'
      };
    } else if (score >= 5) {
      return {
        label: isVi ? 'Trung bình' : 'Average',
        className: 'grade-average',
        emoji: '📝'
      };
    } else {
      return {
        label: isVi ? 'Cần cố gắng' : 'Needs Improvement',
        className: 'grade-poor',
        emoji: '💪'
      };
    }
  }

  /**
   * Format seconds into MM:SS or HH:MM:SS string.
   */
  function formatTimeSpent(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  /* ---------- Export ---------- */
  window.Dexams.Scorer = {
    calculateScore,
    getGrade,
    formatTimeSpent
  };
})();
