/* ============================================
   IMPORTER.JS — File parsing & validation
   ============================================ */

window.Dexams = window.Dexams || {};

(function () {
  'use strict';

  /**
   * Parse a JSON file string into an exam object.
   * @param {string} content — raw JSON string
   * @returns {{ exam: object|null, errors: string[] }}
   */
  function parseJSON(content) {
    const errors = [];
    let data;

    try {
      data = JSON.parse(content);
    } catch (e) {
      return { exam: null, errors: ['Invalid JSON format: ' + e.message] };
    }

    // Normalise: accept both root-level questions array or wrapped object
    if (Array.isArray(data)) {
      data = { questions: data };
    }

    if (!data.questions || !Array.isArray(data.questions)) {
      return { exam: null, errors: ['JSON must contain a "questions" array.'] };
    }

    if (data.questions.length === 0) {
      return { exam: null, errors: ['The exam has no questions.'] };
    }

    // Normalise each question
    const questions = [];
    data.questions.forEach((q, idx) => {
      const num = idx + 1;

      if (!q.text && !q.question) {
        errors.push(`Question ${num}: missing "text" field.`);
        return;
      }

      // Determine type
      let type = 'single';
      if (q.type === 'truefalse' || q.type === 'true_false' || q.type === 'tf' || q.type === 'boolean') {
        type = 'truefalse';
      } else if (q.type === 'multiple' || q.type === 'multi' || q.type === 'checkbox') {
        type = 'multiple';
      } else if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
        type = 'multiple';
      } else if (Array.isArray(q.correctAnswer)) {
        type = 'multiple';
      }

      // Handle True/False questions: auto-generate options if needed
      if (type === 'truefalse') {
        // Accept boolean or 0/1 as correctAnswer
        let correctAnswer = 0;
        if (q.correctAnswer === false || q.correctAnswer === 1 || q.correctAnswer === 'false' || q.correctAnswer === 'Sai') {
          correctAnswer = 1; // False/Sai
        } else {
          correctAnswer = 0; // True/Đúng
        }

        // Auto-generate options if not provided or not exactly 2
        let options = ['Đúng', 'Sai'];
        if (q.options && Array.isArray(q.options) && q.options.length === 2) {
          options = q.options.map(String);
        }

        questions.push({
          id: q.id || num,
          text: q.text || q.question,
          type: 'truefalse',
          options: options,
          correctAnswer: correctAnswer,
          correctAnswers: null,
          explanation: q.explanation || '',
          passage: q.passage || null
        });
        return;
      }

      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`Question ${num}: must have at least 2 options.`);
        return;
      }

      // Normalise correct answer(s)
      let correctAnswer = null;
      let correctAnswers = null;

      if (type === 'multiple') {
        correctAnswers = q.correctAnswers || q.correctAnswer;
        if (!Array.isArray(correctAnswers)) {
          correctAnswers = [correctAnswers];
        }
        // Validate indices
        correctAnswers = correctAnswers.filter(a => typeof a === 'number' && a >= 0 && a < q.options.length);
        if (correctAnswers.length === 0) {
          errors.push(`Question ${num}: no valid correct answers.`);
          return;
        }
      } else {
        correctAnswer = q.correctAnswer !== undefined ? q.correctAnswer : 0;
        if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer >= q.options.length) {
          errors.push(`Question ${num}: invalid correctAnswer index.`);
          return;
        }
      }

      questions.push({
        id: q.id || num,
        text: q.text || q.question,
        type: type,
        options: q.options.map(String),
        correctAnswer: type === 'single' ? correctAnswer : null,
        correctAnswers: type === 'multiple' ? correctAnswers : null,
        explanation: q.explanation || '',
        passage: q.passage || null
      });
    });

    if (questions.length === 0) {
      errors.push('No valid questions found after parsing.');
      return { exam: null, errors };
    }

    const hasPassage = questions.some(q => q.passage);
    const exam = {
      title: data.title || '',
      subject: data.subject || '',
      questions: questions,
      totalQuestions: questions.length,
      format: data.format || (hasPassage ? 'passage' : 'standard')
    };

    return { exam, errors };
  }

  /**
   * Parse a TXT file string into an exam object.
   *
   * Expected format:
   *   Câu 1: Question text?
   *   A. Option 1
   *   B. Option 2
   *   C. Option 3
   *   D. Option 4
   *   Đáp án: A       (single)
   *   Đáp án: A,C     (multiple)
   *   Giải thích: ...  (optional)
   *
   * Also accepts: "Question 1:", "Q1:", etc.
   */
  function parseTXT(content) {
    const errors = [];
    const lines = content.split(/\r?\n/);
    const questions = [];

    let currentQuestion = null;
    let questionNum = 0;
    let currentPassage = null;
    let readingPassageLines = false;

    const QUESTION_REGEX = /^(?:C[âa]u|Question|Q)\s*(\d+)\s*[:.]\s*(.+)/i;
    const OPTION_REGEX = /^([A-Z])\.\s*(.+)/;
    const ANSWER_REGEX = /^(?:[Đđ\u0110\u0111][\u00e1a]p\s*[aá\u00e1]n|Answer|Ans)\s*[:.]\s*(.+)/i;
    const EXPLANATION_REGEX = /^(?:Gi[ảa]i\s*th[ií\u00ed]ch|Explanation|Explain)\s*[:.]\s*(.+)/i;
    const PASSAGE_START_REGEX = /^(?:Đoạn văn|Passage)\s*[:.]?\s*(.*)/i;
    const PASSAGE_END_REGEX = /^(?:Hết đoạn văn|End passage)\s*[:.]?/i;

    // True/False answer patterns - accept Đ/Đúng/True/T/S/Sai/False/F
    const TF_TRUE_PATTERN = /^(?:\u0110|\u0111|Đ|đ|D|d|True|T|\u0110[uú]ng|\u0111[uú]ng|Đúng|đúng)$/i;
    const TF_FALSE_PATTERN = /^(?:S|s|Sai|sai|False|F|f)$/i;

    // Detect [Đ/S] or [D/S] marker in question text — Unicode-safe
    const TF_MARKER_REGEX = /^\[(?:\u0110|\u0111|Đ|đ|D|d)\/(?:S|s)\]\s*/i;

    function isTrueFalseQuestion(q) {
      // 1) Question has [Đ/S] marker → always true/false (no options needed)
      if (q.isTFMarked) return true;

      const ans = (q.answerRaw || '').trim();

      // 2) No options at all + answer matches Đ/S pattern → true/false
      if (q.options.length === 0) {
        return TF_TRUE_PATTERN.test(ans) || TF_FALSE_PATTERN.test(ans);
      }

      // 3) Exactly 2 options matching Đúng/Sai or True/False patterns
      if (q.options.length === 2) {
        const opt0 = q.options[0].replace(/^[A-Z]\.\s*/, '').trim().toLowerCase();
        const opt1 = q.options[1].replace(/^[A-Z]\.\s*/, '').trim().toLowerCase();
        const tfPairs = [
          ['đúng', 'sai'], ['true', 'false'], ['đ', 's'], ['t', 'f']
        ];
        if (tfPairs.some(([t, f]) => opt0 === t && opt1 === f)) return true;

        // Also check: 2 options + answer is Đ/S/Đúng/Sai (not a letter A-D)
        if (TF_TRUE_PATTERN.test(ans) || TF_FALSE_PATTERN.test(ans)) return true;
      }

      return false;
    }

    function finaliseQuestion() {
      if (!currentQuestion) return;

      if (!currentQuestion.answerRaw) {
        errors.push(`Question ${currentQuestion.num}: missing answer.`);
        return;
      }

      const answerRawTrimmed = currentQuestion.answerRaw.trim();

      // Check if this is a True/False question
      const isTF = isTrueFalseQuestion(currentQuestion);
      if (isTF) {
        let correctAnswer;
        if (TF_TRUE_PATTERN.test(answerRawTrimmed)) {
          correctAnswer = 0; // 0 = Đúng/True
        } else if (TF_FALSE_PATTERN.test(answerRawTrimmed)) {
          correctAnswer = 1; // 1 = Sai/False
        } else if (/^[A-Z]$/.test(answerRawTrimmed.toUpperCase())) {
          correctAnswer = answerRawTrimmed.toUpperCase().charCodeAt(0) - 65;
          if (correctAnswer < 0 || correctAnswer > 1) correctAnswer = 0;
        } else {
          errors.push(`Question ${currentQuestion.num}: could not parse True/False answer "${currentQuestion.answerRaw}".`);
          return;
        }

        // Clean up [Đ/S] marker from text if present
        const cleanText = currentQuestion.text.replace(TF_MARKER_REGEX, '').trim();

        questions.push({
          id: currentQuestion.num,
          text: cleanText,
          type: 'truefalse',
          options: ['Đúng', 'Sai'],
          correctAnswer: correctAnswer,
          correctAnswers: null,
          explanation: currentQuestion.explanation || '',
          passage: currentQuestion.passage
        });
        return;
      }

      // Standard single/multiple: must have options
      if (currentQuestion.options.length < 2) {
        errors.push(`Question ${currentQuestion.num}: must have at least 2 options.`);
        return;
      }

      // Parse answer letters (standard single/multiple)
      const answerLetters = answerRawTrimmed
        .split(/[,\s]+/)
        .map(a => a.trim().toUpperCase())
        .filter(a => /^[A-Z]$/.test(a));

      if (answerLetters.length === 0) {
        errors.push(`Question ${currentQuestion.num}: could not parse answer "${currentQuestion.answerRaw}".`);
        return;
      }

      const answerIndices = answerLetters
        .map(letter => letter.charCodeAt(0) - 65)
        .filter(idx => idx >= 0 && idx < currentQuestion.options.length);

      if (answerIndices.length === 0) {
        errors.push(`Question ${currentQuestion.num}: answer indices out of range.`);
        return;
      }

      const type = answerIndices.length > 1 ? 'multiple' : 'single';

      questions.push({
        id: currentQuestion.num,
        text: currentQuestion.text,
        type: type,
        options: currentQuestion.options,
        correctAnswer: type === 'single' ? answerIndices[0] : null,
        correctAnswers: type === 'multiple' ? answerIndices : null,
        explanation: currentQuestion.explanation || '',
        passage: currentQuestion.passage
      });
    }

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      if (!line) {
        if (readingPassageLines && Array.isArray(currentPassage)) {
          currentPassage.push('');
        }
        continue;
      }

      if (PASSAGE_END_REGEX.test(line)) {
        currentPassage = null;
        readingPassageLines = false;
        continue;
      }

      const pMatch = line.match(PASSAGE_START_REGEX);
      if (pMatch) {
        currentPassage = pMatch[1] ? [pMatch[1]] : [];
        readingPassageLines = true;
        continue;
      }

      // Try matching question start
      const qMatch = line.match(QUESTION_REGEX);
      if (qMatch) {
        readingPassageLines = false;
        if (Array.isArray(currentPassage)) {
           currentPassage = currentPassage.join('\n').trim();
           if (!currentPassage) currentPassage = null;
        }
        finaliseQuestion();
        questionNum++;
        const rawText = qMatch[2].trim();
        const isTFMarked = TF_MARKER_REGEX.test(rawText);
        currentQuestion = {
          num: questionNum,
          text: rawText,
          options: [],
          answerRaw: null,
          explanation: '',
          isTFMarked: isTFMarked,
          passage: currentPassage
        };
        continue;
      }

      if (readingPassageLines) {
        if (Array.isArray(currentPassage)) {
            currentPassage.push(line);
        }
        continue;
      }

      if (!currentQuestion) continue;

      // Try matching option
      const oMatch = line.match(OPTION_REGEX);
      if (oMatch) {
        currentQuestion.options.push(oMatch[1] + '. ' + oMatch[2].trim());
        continue;
      }

      // Try matching answer
      const aMatch = line.match(ANSWER_REGEX);
      if (aMatch) {
        currentQuestion.answerRaw = aMatch[1].trim();
        continue;
      }

      // Try matching explanation
      const eMatch = line.match(EXPLANATION_REGEX);
      if (eMatch) {
        currentQuestion.explanation = eMatch[1].trim();
        continue;
      }

      // Append to question text if no match (multi-line question text)
      if (currentQuestion && currentQuestion.options.length === 0) {
        currentQuestion.text += ' ' + line;
      }
    }

    // Finalise last question
    finaliseQuestion();

    if (questions.length === 0) {
      errors.push('No valid questions found in the TXT file.');
      return { exam: null, errors };
    }

    const hasPassage = questions.some(q => q.passage);
    return {
      exam: {
        title: '',
        subject: '',
        questions: questions,
        totalQuestions: questions.length,
        format: hasPassage ? 'passage' : 'standard'
      },
      errors
    };
  }

  /**
   * Parse a JSON file string into a vocabulary set.
   * Expected format: { type: "vocabulary", title, lang, words: [{ word, meaning, image?, example? }] }
   * Also accepts: { words: [...] } without explicit type.
   * @param {string} content — raw JSON string
   * @returns {{ vocabSet: object|null, errors: string[] }}
   */
  function parseVocabJSON(content) {
    const errors = [];
    let data;

    try {
      data = JSON.parse(content);
    } catch (e) {
      return { vocabSet: null, errors: ['Invalid JSON format: ' + e.message] };
    }

    if (!data.words || !Array.isArray(data.words)) {
      return { vocabSet: null, errors: ['JSON must contain a "words" array.'] };
    }

    if (data.words.length === 0) {
      return { vocabSet: null, errors: ['The vocabulary set has no words.'] };
    }

    const words = [];
    data.words.forEach((w, idx) => {
      const num = idx + 1;

      if (!w.word) {
        errors.push(`Word ${num}: missing "word" field.`);
        return;
      }
      if (!w.meaning) {
        errors.push(`Word ${num}: missing "meaning" field.`);
        return;
      }

      words.push({
        id: w.id || num,
        word: String(w.word).trim(),
        meaning: String(w.meaning).trim(),
        image: w.image || '',
        example: w.example || ''
      });
    });

    if (words.length === 0) {
      errors.push('No valid words found after parsing.');
      return { vocabSet: null, errors };
    }

    const vocabSet = {
      title: data.title || '',
      lang: data.lang || 'en',
      words: words,
      totalWords: words.length,
      type: 'vocabulary'
    };

    return { vocabSet, errors };
  }

  /**
   * Check if a parsed JSON object is a vocabulary set.
   */
  function isVocabJSON(content) {
    try {
      const data = JSON.parse(content);
      return data.type === 'vocabulary' || (Array.isArray(data.words) && data.words.length > 0);
    } catch {
      return false;
    }
  }

  /**
   * Detect file type and parse accordingly.
   */
  function parseFile(content, filename) {
    const ext = (filename || '').split('.').pop().toLowerCase();
    if (ext === 'json') {
      // Check if it's a vocabulary file first
      if (isVocabJSON(content)) {
        return parseVocabJSON(content);
      }
      return parseJSON(content);
    } else if (ext === 'txt') {
      return parseTXT(content);
    } else {
      // Try JSON first, then TXT
      try {
        JSON.parse(content);
        if (isVocabJSON(content)) {
          return parseVocabJSON(content);
        }
        return parseJSON(content);
      } catch {
        return parseTXT(content);
      }
    }
  }

  /* ---------- Export ---------- */
  window.Dexams.Importer = {
    parseJSON,
    parseTXT,
    parseVocabJSON,
    isVocabJSON,
    parseFile
  };
})();
