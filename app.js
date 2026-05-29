/* ============================================
   APP.JS — Main Application Controller
   i18n, routing, event orchestration
   ============================================ */

window.Dexams = window.Dexams || {};

(function () {
  'use strict';

  const {
    ExamStorage,
    HistoryStorage,
    SettingsStorage,
    ProgressStorage,
    ExamEngine,
    Importer,
    Scorer,
    generateId
  } = window.Dexams;

  /* ================================================
     I18N — Translations
     ================================================ */
  const translations = {
    en: {
      nav_home: 'Home',
      nav_import: 'Import',
      nav_exams: 'Exams',
      nav_history: 'History',
      hero_subtitle: 'Practice exams, ace your tests. Import question sets, set your own timer, and track your progress.',
      stat_exams: 'Exams Imported',
      stat_attempts: 'Attempts',
      stat_avg_score: 'Average Score',
      action_import: 'Import Exam',
      action_import_desc: 'Upload JSON or TXT question files',
      action_practice: 'Start Practice',
      action_practice_desc: 'Choose an exam and set your timer',
      action_history: 'View History',
      action_history_desc: 'Review past attempts and track progress',
      import_title: 'Import Exam',
      import_drag: 'Drag & drop your file here',
      import_or: 'or',
      import_browse: 'Browse Files',
      import_formats: 'Supported formats: JSON, TXT',
      preview_title: 'Preview',
      preview_exam_title: 'Exam Title',
      preview_exam_subject: 'Subject',
      preview_sample_questions: 'Sample Questions',
      btn_cancel: 'Cancel',
      btn_import: 'Import Exam',
      btn_import_new: '+ Import New',
      btn_import_first: 'Import Your First Exam',
      format_guide_title: '📖 Import Format Guide',
      exams_title: 'Your Exams',
      exams_empty: 'No exams yet. Import one to get started!',
      config_title: 'Configure Exam',
      config_time: 'Time Limit (minutes)',
      config_custom: 'Custom',
      config_question_count: 'Number of Questions',
      config_shuffle: 'Shuffle question order',
      btn_start_exam: '🚀 Start Exam',
      hint_multi: 'Select all correct answers',
      btn_prev: 'Previous',
      btn_next: 'Next',
      btn_mark_review: '🔖 Mark for Review',
      nav_panel_title: 'Question Navigator',
      legend_current: 'Current',
      legend_answered: 'Answered',
      legend_marked: 'Marked for Review',
      legend_unanswered: 'Unanswered',
      btn_submit: 'Submit Exam',
      results_title: 'Exam Results',
      results_out_of: '/10',
      results_correct: 'Correct',
      results_wrong: 'Wrong',
      results_skipped: 'Skipped',
      results_time: 'Time Spent',
      btn_review_answers: '🔍 Review Answers',
      btn_retry: '🔄 Retry Exam',
      btn_go_home: '🏠 Go Home',
      review_title: 'Review Answers',
      btn_back_results: '← Back to Results',
      history_title: 'Attempt History',
      btn_clear_history: 'Clear All',
      history_empty: 'No attempts yet. Start practicing!',
      btn_start_first: 'Start Your First Exam',
      btn_practice: 'Practice',
      btn_delete: 'Delete',
      questions_label: 'questions',
      single_label: 'Single Choice',
      multiple_label: 'Multiple Choice',
      mixed_label: 'Mixed',
      question_word: 'Question',
      modal_submit_title: 'Submit Exam?',
      modal_submit_body: 'You have answered {answered} out of {total} questions. Are you sure you want to submit?',
      modal_submit_confirm: 'Submit',
      modal_submit_cancel: 'Continue',
      modal_timeup_title: '⏰ Time\'s Up!',
      modal_timeup_body: 'Your exam has been automatically submitted.',
      modal_timeup_confirm: 'View Results',
      modal_delete_title: 'Delete Exam?',
      modal_delete_body: 'Are you sure you want to delete "{title}"? This action cannot be undone.',
      modal_delete_confirm: 'Delete',
      toast_imported: 'Exam imported successfully!',
      toast_deleted: 'Exam deleted.',
      toast_import_error: 'Import error: ',
      toast_history_cleared: 'History cleared.',
      correct_answer: 'Correct Answer',
      your_answer: 'Your Answer',
      skipped_label: 'Skipped',
      correct_label: '✓ Correct',
      incorrect_label: '✗ Incorrect',
      badge_correct_selected: '✓ Selected',
      badge_correct_missed: 'Correct Answer',
      badge_incorrect_selected: '✗ Selected',
      preview_questions_count: 'Questions',
      preview_single_count: 'Single Choice',
      preview_multi_count: 'Multiple Choice',
      created_label: 'Created',
      score_label: 'Score',
      time_label: 'Time',
      date_label: 'Date'
    },
    vi: {
      nav_home: 'Trang chủ',
      nav_import: 'Nhập đề',
      nav_exams: 'Đề thi',
      nav_history: 'Lịch sử',
      hero_subtitle: 'Luyện đề thi, chinh phục kỳ thi. Nhập bộ đề, tùy chỉnh thời gian, theo dõi tiến trình học tập.',
      stat_exams: 'Đề đã nhập',
      stat_attempts: 'Lần thi',
      stat_avg_score: 'Điểm trung bình',
      action_import: 'Nhập đề thi',
      action_import_desc: 'Tải lên file JSON hoặc TXT',
      action_practice: 'Bắt đầu luyện',
      action_practice_desc: 'Chọn đề thi và đặt thời gian',
      action_history: 'Xem lịch sử',
      action_history_desc: 'Xem lại các lần thi và theo dõi tiến bộ',
      import_title: 'Nhập đề thi',
      import_drag: 'Kéo thả file vào đây',
      import_or: 'hoặc',
      import_browse: 'Chọn file',
      import_formats: 'Hỗ trợ định dạng: JSON, TXT',
      preview_title: 'Xem trước',
      preview_exam_title: 'Tên đề thi',
      preview_exam_subject: 'Môn học',
      preview_sample_questions: 'Câu hỏi mẫu',
      btn_cancel: 'Hủy',
      btn_import: 'Nhập đề',
      btn_import_new: '+ Nhập đề mới',
      btn_import_first: 'Nhập đề thi đầu tiên',
      format_guide_title: '📖 Hướng dẫn định dạng',
      exams_title: 'Đề thi của bạn',
      exams_empty: 'Chưa có đề thi nào. Hãy nhập đề để bắt đầu!',
      config_title: 'Cấu hình bài thi',
      config_time: 'Thời gian (phút)',
      config_custom: 'Tùy chỉnh',
      config_question_count: 'Số câu hỏi',
      config_shuffle: 'Đảo thứ tự câu hỏi',
      btn_start_exam: '🚀 Bắt đầu thi',
      hint_multi: 'Chọn tất cả đáp án đúng',
      btn_prev: 'Câu trước',
      btn_next: 'Câu sau',
      btn_mark_review: '🔖 Đánh dấu xem lại',
      nav_panel_title: 'Bảng điều hướng',
      legend_current: 'Đang xem',
      legend_answered: 'Đã trả lời',
      legend_marked: 'Đánh dấu xem lại',
      legend_unanswered: 'Chưa trả lời',
      btn_submit: 'Nộp bài',
      results_title: 'Kết quả bài thi',
      results_out_of: '/10',
      results_correct: 'Đúng',
      results_wrong: 'Sai',
      results_skipped: 'Bỏ qua',
      results_time: 'Thời gian',
      btn_review_answers: '🔍 Xem lại đáp án',
      btn_retry: '🔄 Làm lại',
      btn_go_home: '🏠 Về trang chủ',
      review_title: 'Xem lại đáp án',
      btn_back_results: '← Quay lại kết quả',
      history_title: 'Lịch sử làm bài',
      btn_clear_history: 'Xóa tất cả',
      history_empty: 'Chưa có lần thi nào. Hãy bắt đầu luyện tập!',
      btn_start_first: 'Bắt đầu bài thi đầu tiên',
      btn_practice: 'Luyện thi',
      btn_delete: 'Xóa',
      questions_label: 'câu',
      single_label: 'Một đáp án',
      multiple_label: 'Nhiều đáp án',
      mixed_label: 'Hỗn hợp',
      question_word: 'Câu',
      modal_submit_title: 'Nộp bài?',
      modal_submit_body: 'Bạn đã trả lời {answered} trên {total} câu. Bạn có chắc muốn nộp bài?',
      modal_submit_confirm: 'Nộp bài',
      modal_submit_cancel: 'Tiếp tục làm',
      modal_timeup_title: '⏰ Hết giờ!',
      modal_timeup_body: 'Bài thi đã được nộp tự động.',
      modal_timeup_confirm: 'Xem kết quả',
      modal_delete_title: 'Xóa đề thi?',
      modal_delete_body: 'Bạn có chắc muốn xóa "{title}"? Hành động này không thể hoàn tác.',
      modal_delete_confirm: 'Xóa',
      toast_imported: 'Nhập đề thi thành công!',
      toast_deleted: 'Đã xóa đề thi.',
      toast_import_error: 'Lỗi nhập: ',
      toast_history_cleared: 'Đã xóa lịch sử.',
      correct_answer: 'Đáp án đúng',
      your_answer: 'Đáp án bạn chọn',
      skipped_label: 'Bỏ qua',
      correct_label: '✓ Đúng',
      incorrect_label: '✗ Sai',
      badge_correct_selected: '✓ Bạn chọn',
      badge_correct_missed: 'Đáp án đúng',
      badge_incorrect_selected: '✗ Bạn chọn',
      preview_questions_count: 'Số câu hỏi',
      preview_single_count: 'Câu một đáp án',
      preview_multi_count: 'Câu nhiều đáp án',
      created_label: 'Ngày tạo',
      score_label: 'Điểm',
      time_label: 'Thời gian',
      date_label: 'Ngày'
    }
  };

  /* ================================================
     APP STATE
     ================================================ */
  let currentLang = SettingsStorage.get('lang', 'vi');
  let currentPage = 'home';
  let engine = null;
  let lastResult = null;          // last scored result for review
  let selectedExamId = null;      // exam chosen for config
  let pendingExam = null;         // parsed exam awaiting import confirmation

  /* ================================================
     I18N FUNCTIONS
     ================================================ */
  function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || key;
  }

  function updateAllI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = t(key);
      if (text) el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });
    // Update lang toggle button
    const langBtn = document.getElementById('langToggle');
    if (langBtn) langBtn.textContent = currentLang === 'en' ? 'VI' : 'EN';
  }

  function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'vi' : 'en';
    SettingsStorage.set('lang', currentLang);
    updateAllI18n();
    // Re-render dynamic content on current page
    renderCurrentPage();
  }

  /* ================================================
     ROUTING
     ================================================ */
  function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.add('active');
    }
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-page') === page);
    });
    currentPage = page;
    // Close mobile menu
    document.getElementById('navMenu').classList.remove('open');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Render page content
    renderCurrentPage();
  }

  function renderCurrentPage() {
    switch (currentPage) {
      case 'home': renderHome(); break;
      case 'import': break; // static
      case 'exams': renderExamList(); break;
      case 'config': renderConfig(); break;
      case 'exam': break; // managed by engine
      case 'results': break; // rendered on submit
      case 'review': break; // rendered on demand
      case 'history': renderHistory(); break;
    }
  }

  /* ================================================
     HOME PAGE
     ================================================ */
  function renderHome() {
    document.getElementById('statExams').textContent = ExamStorage.count();
    document.getElementById('statAttempts').textContent = HistoryStorage.count();
    const avg = HistoryStorage.getAverageScore();
    document.getElementById('statAvgScore').textContent = avg > 0 ? avg.toFixed(1) : '-';
  }

  /* ================================================
     IMPORT PAGE
     ================================================ */
  function setupImport() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');

    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) handleFile(file);
      fileInput.value = '';
    });

    document.getElementById('cancelImportBtn').addEventListener('click', cancelImport);
    document.getElementById('confirmImportBtn').addEventListener('click', confirmImport);
  }

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const result = Importer.parseFile(content, file.name);

      if (result.errors.length > 0 && !result.exam) {
        showToast(t('toast_import_error') + result.errors[0], 'error');
        return;
      }

      if (result.errors.length > 0) {
        showToast(t('toast_import_error') + result.errors.join('; '), 'warning');
      }

      pendingExam = result.exam;
      showImportPreview(result.exam);
    };
    reader.readAsText(file);
  }

  function showImportPreview(exam) {
    document.getElementById('importPreview').classList.remove('hidden');
    document.getElementById('dropZone').classList.add('hidden');
    document.getElementById('formatGuide').classList.add('hidden');

    // Fill title/subject
    document.getElementById('importTitle').value = exam.title || '';
    document.getElementById('importSubject').value = exam.subject || '';

    // Info
    const singleCount = exam.questions.filter(q => q.type !== 'multiple').length;
    const multiCount = exam.questions.filter(q => q.type === 'multiple').length;

    const infoHtml = `
      <div class="preview-info-item">
        <div class="preview-info-label">${t('preview_questions_count')}</div>
        <div class="preview-info-value">${exam.questions.length}</div>
      </div>
      <div class="preview-info-item">
        <div class="preview-info-label">${t('preview_single_count')}</div>
        <div class="preview-info-value">${singleCount}</div>
      </div>
      <div class="preview-info-item">
        <div class="preview-info-label">${t('preview_multi_count')}</div>
        <div class="preview-info-value">${multiCount}</div>
      </div>
    `;
    document.getElementById('previewInfo').innerHTML = infoHtml;

    // Sample questions (first 3)
    const samples = exam.questions.slice(0, 3);
    const questionsHtml = samples.map((q, i) => `
      <div class="preview-question">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
          <span class="preview-question-text">${t('question_word')} ${i + 1}: ${escapeHtml(q.text)}</span>
          <span class="preview-question-type ${q.type === 'multiple' ? 'type-multiple' : 'type-single'}">
            ${q.type === 'multiple' ? t('multiple_label') : t('single_label')}
          </span>
        </div>
        <div style="padding-left: var(--space-4); color: var(--text-muted); font-size: var(--font-sm);">
          ${q.options.map(o => `<div>• ${escapeHtml(o)}</div>`).join('')}
        </div>
      </div>
    `).join('');
    document.getElementById('previewQuestions').innerHTML = questionsHtml;
  }

  function cancelImport() {
    pendingExam = null;
    document.getElementById('importPreview').classList.add('hidden');
    document.getElementById('dropZone').classList.remove('hidden');
    document.getElementById('formatGuide').classList.remove('hidden');
  }

  function confirmImport() {
    if (!pendingExam) return;

    pendingExam.title = document.getElementById('importTitle').value.trim() || 'Untitled Exam';
    pendingExam.subject = document.getElementById('importSubject').value.trim() || '';
    pendingExam.id = generateId();

    ExamStorage.save(pendingExam);
    showToast(t('toast_imported'), 'success');

    pendingExam = null;
    cancelImport();
    navigateTo('exams');
  }

  /* ================================================
     EXAM LIST PAGE
     ================================================ */
  function renderExamList() {
    const exams = ExamStorage.getAll();
    const grid = document.getElementById('examGrid');
    const empty = document.getElementById('emptyExams');

    if (exams.length === 0) {
      grid.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    grid.classList.remove('hidden');

    grid.innerHTML = exams.map(exam => {
      const singleCount = exam.questions.filter(q => q.type !== 'multiple').length;
      const multiCount = exam.questions.filter(q => q.type === 'multiple').length;
      let typeLabel = '';
      if (singleCount > 0 && multiCount > 0) typeLabel = t('mixed_label');
      else if (multiCount > 0) typeLabel = t('multiple_label');
      else typeLabel = t('single_label');

      const bestScore = HistoryStorage.getBestScore(exam.id);
      const attempts = HistoryStorage.getByExamId(exam.id).length;

      return `
        <div class="exam-card" data-exam-id="${exam.id}">
          ${exam.subject ? `<span class="exam-card-subject">${escapeHtml(exam.subject)}</span>` : ''}
          <div class="exam-card-title">${escapeHtml(exam.title)}</div>
          <div class="exam-card-meta">
            <span>📝 ${exam.totalQuestions} ${t('questions_label')}</span>
            <span>📋 ${typeLabel}</span>
            ${attempts > 0 ? `<span>⭐ ${bestScore.toFixed(1)}</span>` : ''}
          </div>
          <div class="exam-card-actions">
            <button class="btn btn-primary btn-sm" onclick="Dexams.App.startConfig('${exam.id}')">${t('btn_practice')}</button>
            <button class="btn btn-danger btn-sm" onclick="Dexams.App.deleteExam('${exam.id}', '${escapeHtml(exam.title).replace(/'/g, "\\'")}')">${t('btn_delete')}</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function startConfig(examId) {
    selectedExamId = examId;
    navigateTo('config');
  }

  function deleteExam(examId, title) {
    showModal(
      t('modal_delete_title'),
      t('modal_delete_body').replace('{title}', title),
      [
        { text: t('btn_cancel'), class: 'btn-secondary', action: hideModal },
        {
          text: t('modal_delete_confirm'), class: 'btn-danger', action: () => {
            ExamStorage.delete(examId);
            hideModal();
            showToast(t('toast_deleted'), 'info');
            renderExamList();
            renderHome();
          }
        }
      ]
    );
  }

  /* ================================================
     CONFIG PAGE
     ================================================ */
  function renderConfig() {
    const exam = ExamStorage.getById(selectedExamId);
    if (!exam) {
      navigateTo('exams');
      return;
    }

    document.getElementById('configExamTitle').textContent = exam.title;

    const slider = document.getElementById('questionCountSlider');
    slider.max = exam.totalQuestions;
    slider.value = exam.totalQuestions;
    document.getElementById('questionCountDisplay').textContent = exam.totalQuestions;

    slider.oninput = () => {
      document.getElementById('questionCountDisplay').textContent = slider.value;
    };
  }

  function setupConfig() {
    // Time presets
    document.getElementById('timePresets').addEventListener('click', (e) => {
      const preset = e.target.closest('.time-preset');
      if (!preset) return;

      document.querySelectorAll('.time-preset').forEach(p => p.classList.remove('selected'));
      preset.classList.add('selected');

      const customInput = document.getElementById('customTimeInput');
      if (preset.getAttribute('data-time') === 'custom') {
        customInput.classList.remove('hidden');
        customInput.focus();
      } else {
        customInput.classList.add('hidden');
      }
    });

    // Start exam
    document.getElementById('startExamBtn').addEventListener('click', () => {
      const exam = ExamStorage.getById(selectedExamId);
      if (!exam) return;

      // Get time
      let timeMinutes = 45;
      const selectedPreset = document.querySelector('.time-preset.selected');
      if (selectedPreset) {
        const val = selectedPreset.getAttribute('data-time');
        if (val === 'custom') {
          timeMinutes = parseInt(document.getElementById('customTimeInput').value) || 45;
        } else {
          timeMinutes = parseInt(val);
        }
      }

      const shuffle = document.getElementById('shuffleToggle').checked;
      const questionCount = parseInt(document.getElementById('questionCountSlider').value);

      startExam(exam, { timeMinutes, shuffle, questionCount });
    });
  }

  /* ================================================
     EXAM ENGINE
     ================================================ */
  function startExam(exam, config) {
    // Destroy previous engine
    if (engine) engine.destroy();

    engine = new ExamEngine(exam, config);

    // Timer callback
    engine.onTimerUpdate = (remaining, total) => {
      updateTimerDisplay(remaining, total);
    };

    // Time up callback
    engine.onTimeUp = () => {
      const result = engine.submit();
      if (result) {
        processResult(result);
        showModal(
          t('modal_timeup_title'),
          t('modal_timeup_body'),
          [{ text: t('modal_timeup_confirm'), class: 'btn-primary', action: () => { hideModal(); navigateTo('results'); } }]
        );
      }
    };

    engine.start();
    navigateTo('exam');
    renderQuestion();
    renderNavGrid();
    updateTimerDisplay(engine.timeRemaining, engine.totalTime);
  }

  function renderQuestion() {
    if (!engine) return;

    const q = engine.getCurrentQuestion();
    const idx = engine.currentIndex;
    const total = engine.questions.length;

    // Question number
    document.getElementById('questionNumber').textContent =
      `${t('question_word')} ${idx + 1} / ${total}`;

    // Type badge
    const badge = document.getElementById('questionTypeBadge');
    if (q.type === 'multiple') {
      badge.textContent = t('multiple_label');
      badge.className = 'question-type-badge type-multiple';
      document.getElementById('questionHint').classList.remove('hidden');
    } else {
      badge.textContent = t('single_label');
      badge.className = 'question-type-badge type-single';
      document.getElementById('questionHint').classList.add('hidden');
    }

    // Question text
    document.getElementById('questionText').textContent = q.text;

    // Options
    const answer = engine.getAnswer(idx);
    const optionsHtml = q.options.map((opt, oi) => {
      let selected = false;
      if (q.type === 'multiple' && Array.isArray(answer)) {
        selected = answer.includes(oi);
      } else {
        selected = answer === oi;
      }

      const letter = String.fromCharCode(65 + oi);
      const markerClass = q.type === 'multiple' ? 'option-marker checkbox-marker' : 'option-marker';

      return `
        <li class="option-item ${selected ? 'selected' : ''}" data-option="${oi}">
          <span class="${markerClass}">${selected ? '✓' : letter}</span>
          <span class="option-text">${escapeHtml(opt)}</span>
        </li>
      `;
    }).join('');
    document.getElementById('optionsList').innerHTML = optionsHtml;

    // Progress
    const progress = engine.getProgress();
    document.getElementById('examProgress').textContent = `${progress.answered}/${progress.total}`;

    // Mark button state
    const markBtn = document.getElementById('markReviewBtn');
    if (engine.isMarked(idx)) {
      markBtn.classList.add('text-warning');
    } else {
      markBtn.classList.remove('text-warning');
    }

    // Nav button states
    document.getElementById('prevQuestionBtn').disabled = idx === 0;
    document.getElementById('nextQuestionBtn').disabled = idx === total - 1;

    updateNavGrid();
  }

  function renderNavGrid() {
    if (!engine) return;
    const grid = document.getElementById('navGrid');
    let html = '';
    for (let i = 0; i < engine.questions.length; i++) {
      html += `<button class="nav-cell" data-nav="${i}">${i + 1}</button>`;
    }
    grid.innerHTML = html;
    updateNavGrid();
  }

  function updateNavGrid() {
    if (!engine) return;
    document.querySelectorAll('.nav-cell').forEach(cell => {
      const i = parseInt(cell.getAttribute('data-nav'));
      cell.classList.remove('current', 'answered', 'marked');
      if (i === engine.currentIndex) cell.classList.add('current');
      if (engine.isAnswered(i)) cell.classList.add('answered');
      if (engine.isMarked(i)) cell.classList.add('marked');
    });
  }

  function updateTimerDisplay(remaining, total) {
    const display = document.getElementById('timerDisplay');
    const bar = document.getElementById('timerProgressBar');

    display.textContent = ExamEngine.formatTime(remaining);

    const pct = (remaining / total) * 100;
    bar.style.width = pct + '%';

    // Color states
    display.classList.remove('warning', 'danger');
    bar.classList.remove('warning');

    if (remaining <= 60) {
      display.classList.add('danger');
      bar.classList.add('warning');
    } else if (remaining <= total * 0.2) {
      display.classList.add('warning');
      bar.classList.add('warning');
    }
  }

  function setupExam() {
    // Options click
    document.getElementById('optionsList').addEventListener('click', (e) => {
      const item = e.target.closest('.option-item');
      if (!item || !engine) return;
      const optionIdx = parseInt(item.getAttribute('data-option'));
      engine.selectAnswer(engine.currentIndex, optionIdx);
      renderQuestion();
    });

    // Navigation
    document.getElementById('prevQuestionBtn').addEventListener('click', () => {
      if (engine && engine.prev()) renderQuestion();
    });

    document.getElementById('nextQuestionBtn').addEventListener('click', () => {
      if (engine && engine.next()) renderQuestion();
    });

    // Mark for review
    document.getElementById('markReviewBtn').addEventListener('click', () => {
      if (!engine) return;
      engine.toggleMark(engine.currentIndex);
      renderQuestion();
    });

    // Nav grid click
    document.getElementById('navGrid').addEventListener('click', (e) => {
      const cell = e.target.closest('.nav-cell');
      if (!cell || !engine) return;
      const idx = parseInt(cell.getAttribute('data-nav'));
      engine.goToQuestion(idx);
      renderQuestion();
    });

    // Submit
    document.getElementById('submitExamBtn').addEventListener('click', () => {
      if (!engine) return;
      const progress = engine.getProgress();
      showModal(
        t('modal_submit_title'),
        t('modal_submit_body')
          .replace('{answered}', progress.answered)
          .replace('{total}', progress.total),
        [
          { text: t('modal_submit_cancel'), class: 'btn-secondary', action: hideModal },
          {
            text: t('modal_submit_confirm'), class: 'btn-primary', action: () => {
              hideModal();
              const result = engine.submit();
              if (result) {
                processResult(result);
                navigateTo('results');
              }
            }
          }
        ]
      );
    });
  }

  /* ================================================
     RESULTS & SCORING
     ================================================ */
  function processResult(rawResult) {
    const scoreData = Scorer.calculateScore(rawResult.questions, rawResult.answers);
    lastResult = {
      ...rawResult,
      ...scoreData
    };

    // Save to history
    HistoryStorage.save({
      id: generateId(),
      examId: rawResult.examId,
      examTitle: rawResult.examTitle,
      score: scoreData.score,
      correct: scoreData.correct,
      wrong: scoreData.wrong,
      skipped: scoreData.skipped,
      total: scoreData.total,
      percentage: scoreData.percentage,
      timeSpent: rawResult.timeSpent,
      timeLimit: rawResult.timeLimit,
      submittedAt: rawResult.submittedAt
    });

    renderResults();
  }

  function renderResults() {
    if (!lastResult) return;

    const { score, correct, wrong, skipped, total, percentage, timeSpent } = lastResult;

    // Score with animation
    animateCounter('resultScore', score, 1);

    // Donut chart
    const donut = document.getElementById('donutChart');
    const correctPct = (correct / total) * 100;
    const wrongPct = (wrong / total) * 100;
    const skippedPct = (skipped / total) * 100;
    donut.style.background = `conic-gradient(
      var(--success) 0% ${correctPct}%,
      var(--error) ${correctPct}% ${correctPct + wrongPct}%,
      var(--text-dim) ${correctPct + wrongPct}% 100%
    )`;

    // Grade badge
    const grade = Scorer.getGrade(score, currentLang);
    document.getElementById('gradeBadge').innerHTML =
      `<div class="grade-badge ${grade.className}">${grade.emoji} ${grade.label}</div>`;

    // Summary stats
    document.getElementById('resultCorrect').textContent = correct;
    document.getElementById('resultWrong').textContent = wrong;
    document.getElementById('resultSkipped').textContent = skipped;
    document.getElementById('resultTime').textContent = Scorer.formatTimeSpent(timeSpent);
  }

  function animateCounter(elementId, target, decimals) {
    const el = document.getElementById(elementId);
    const duration = 1200;
    const start = Date.now();

    function update() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = eased * target;
      el.textContent = current.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function setupResults() {
    document.getElementById('reviewAnswersBtn').addEventListener('click', () => {
      renderReview();
      navigateTo('review');
    });

    document.getElementById('retryExamBtn').addEventListener('click', () => {
      if (lastResult && lastResult.examId) {
        startConfig(lastResult.examId);
      }
    });

    document.getElementById('backToResultsBtn').addEventListener('click', () => {
      navigateTo('results');
    });
  }

  /* ================================================
     REVIEW PAGE
     ================================================ */
  function renderReview() {
    if (!lastResult || !lastResult.details) return;

    const section = document.getElementById('reviewSection');
    section.innerHTML = lastResult.details.map((d, i) => {
      const q = d.question;
      const statusClass = d.isSkipped ? 'status-skipped' : (d.isCorrect ? 'status-correct' : 'status-incorrect');
      const statusText = d.isSkipped ? t('skipped_label') : (d.isCorrect ? t('correct_label') : t('incorrect_label'));

      // Build options HTML
      const optionsHtml = q.options.map((opt, oi) => {
        const isCorrectOption = q.type === 'multiple'
          ? (q.correctAnswers || []).includes(oi)
          : q.correctAnswer === oi;

        let isSelected = false;
        if (d.answer !== null && d.answer !== undefined) {
          isSelected = Array.isArray(d.answer) ? d.answer.includes(oi) : d.answer === oi;
        }

        let cls = '';
        let badgeHtml = '';
        const letter = String.fromCharCode(65 + oi);
        const markerClass = q.type === 'multiple' ? 'option-marker checkbox-marker' : 'option-marker';
        let markerContent = letter;

        if (isCorrectOption) {
          if (isSelected) {
            cls = 'correct';
            markerContent = '✓';
            badgeHtml = `<span class="review-badge badge-correct-selected">${t('badge_correct_selected')}</span>`;
          } else {
            cls = 'correct-missed';
            markerContent = '✓';
            badgeHtml = `<span class="review-badge badge-correct-missed">${t('badge_correct_missed')}</span>`;
          }
        } else {
          if (isSelected) {
            cls = 'incorrect';
            markerContent = '✗';
            badgeHtml = `<span class="review-badge badge-incorrect-selected">${t('badge_incorrect_selected')}</span>`;
          }
        }

        return `
          <li class="option-item ${cls}" style="cursor: default;">
            <span class="${markerClass}">${markerContent}</span>
            <span class="option-text">${escapeHtml(opt)}</span>
            ${badgeHtml}
          </li>
        `;
      }).join('');

      const explanationHtml = q.explanation
        ? `<div class="review-explanation">${escapeHtml(q.explanation)}</div>`
        : '';

      return `
        <div class="review-question">
          <div class="review-question-header">
            <span class="question-number">${t('question_word')} ${i + 1}</span>
            <span class="review-status ${statusClass}">${statusText}</span>
          </div>
          <div class="question-text" style="margin-bottom: var(--space-4);">${escapeHtml(q.text)}</div>
          <ul class="options-list">${optionsHtml}</ul>
          ${explanationHtml}
        </div>
      `;
    }).join('');
  }

  /* ================================================
     HISTORY PAGE
     ================================================ */
  function renderHistory() {
    const history = HistoryStorage.getAll();
    const list = document.getElementById('historyList');
    const empty = document.getElementById('emptyHistory');
    const clearBtn = document.getElementById('clearHistoryBtn');

    if (history.length === 0) {
      list.classList.add('hidden');
      empty.classList.remove('hidden');
      clearBtn.classList.add('hidden');
      return;
    }

    empty.classList.add('hidden');
    list.classList.remove('hidden');
    clearBtn.classList.remove('hidden');

    list.innerHTML = history.map(h => {
      const grade = Scorer.getGrade(h.score, currentLang);
      const date = new Date(h.submittedAt).toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      return `
        <div class="history-item" data-history-id="${h.id}">
          <div class="history-info">
            <div class="history-title">${escapeHtml(h.examTitle || 'Untitled')}</div>
            <div class="history-meta">
              <span>📅 ${date}</span>
              <span>✅ ${h.correct}/${h.total}</span>
              <span>⏱️ ${Scorer.formatTimeSpent(h.timeSpent || 0)}</span>
            </div>
          </div>
          <div class="history-score" style="color: ${grade.className === 'grade-excellent' ? 'var(--success)' : grade.className === 'grade-good' ? 'var(--primary-light)' : grade.className === 'grade-average' ? 'var(--warning)' : 'var(--error)'}">
            ${h.score.toFixed(1)}
          </div>
        </div>
      `;
    }).join('');
  }

  function setupHistory() {
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
      showModal(
        t('btn_clear_history'),
        currentLang === 'vi' ? 'Bạn có chắc muốn xóa tất cả lịch sử?' : 'Are you sure you want to clear all history?',
        [
          { text: t('btn_cancel'), class: 'btn-secondary', action: hideModal },
          {
            text: t('modal_delete_confirm'), class: 'btn-danger', action: () => {
              HistoryStorage.clear();
              hideModal();
              showToast(t('toast_history_cleared'), 'info');
              renderHistory();
              renderHome();
            }
          }
        ]
      );
    });
  }

  /* ================================================
     MODAL
     ================================================ */
  function showModal(title, body, buttons) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').textContent = body;

    const actionsEl = document.getElementById('modalActions');
    actionsEl.innerHTML = '';
    buttons.forEach(btn => {
      const b = document.createElement('button');
      b.className = 'btn ' + btn.class;
      b.textContent = btn.text;
      b.addEventListener('click', btn.action);
      actionsEl.appendChild(b);
    });

    document.getElementById('modalOverlay').classList.add('active');
  }

  function hideModal() {
    document.getElementById('modalOverlay').classList.remove('active');
  }

  /* ================================================
     TOAST
     ================================================ */
  function showToast(message, type) {
    type = type || 'info';
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* ================================================
     HELPERS
     ================================================ */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ================================================
     INITIALIZATION
     ================================================ */
  function init() {
    // Setup all event listeners
    setupImport();
    setupConfig();
    setupExam();
    setupResults();
    setupHistory();

    // Language toggle
    document.getElementById('langToggle').addEventListener('click', toggleLanguage);

    // Logo click → home
    document.getElementById('logoBtn').addEventListener('click', () => navigateTo('home'));

    // Mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
      document.getElementById('navMenu').classList.toggle('open');
    });

    // Nav links
    document.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.getAttribute('data-page'));
      });
    });

    // data-navigate buttons
    document.querySelectorAll('[data-navigate]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigateTo(btn.getAttribute('data-navigate'));
      });
    });

    // Modal overlay click to close
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === e.target.closest('.modal-overlay')) {
        hideModal();
      }
    });

    // Keyboard shortcuts for exam
    document.addEventListener('keydown', (e) => {
      if (currentPage !== 'exam' || !engine) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (engine.next()) renderQuestion();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (engine.prev()) renderQuestion();
      } else if (e.key >= '1' && e.key <= '9') {
        const optIdx = parseInt(e.key) - 1;
        const q = engine.getCurrentQuestion();
        if (optIdx < q.options.length) {
          engine.selectAnswer(engine.currentIndex, optIdx);
          renderQuestion();
        }
      }
    });

    // Apply language
    updateAllI18n();

    // Render initial page
    renderHome();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ================================================
     PUBLIC API (for onclick handlers in HTML)
     ================================================ */
  window.Dexams.App = {
    navigateTo,
    startConfig,
    deleteExam,
    showToast,
    toggleLanguage
  };
})();
