const fs = require('fs');
const content = `
Đoạn văn: Passage 1
Line 2 of passage 1

Câu 1: Question 1
A. 1
B. 2
Đáp án: A

Câu 2: Question 2
A. 1
B. 2
Đáp án: B

Đoạn văn: Passage 2
Line 2 of passage 2

Câu 3: Question 3
A. 1
B. 2
Đáp án: A
`;

function testParse() {
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

    function finaliseQuestion() {
        if (!currentQuestion) return;
        questions.push(currentQuestion);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

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
        currentQuestion = {
          num: questionNum,
          text: rawText,
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
    }
    finaliseQuestion();

    console.log(JSON.stringify(questions, null, 2));
}

testParse();
