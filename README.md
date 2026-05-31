# Dexams

Dexams is a premium, high-performance, single-page application (SPA) designed for practicing multiple-choice exams. It runs entirely on the client side directly within any modern web browser, eliminating the need for a backend or complex build processes. All user data and progress are stored locally on your device for privacy and speed.

## 🌟 Key Features

- **Dynamic Importer (`importer.js`)**: Easily import custom exams using either `.json` or `.txt` formats. Includes robust syntax validation and error reporting.
- **Robust Exam Engine (`exam-engine.js`)**: Real-time exam state management, keyboard navigation (Arrow keys, 1-9 for options), customizable timers, auto-saving, and a "Mark for Review" bookmarking system.
- **Smart Scorer (`scorer.js`)**: Automatic score calculation, attempt history tracking, and premium grade badges (e.g., *Xuất sắc / Excellent*, *Khá / Good*).
- **Premium Question Review & Badges**: An elegant review mode that clearly indicates your correct choices (✓ Selected), correct answers you missed (Correct Answer), and incorrect choices (✗ Selected).
- **Bilingual Support (EN/VI)**: Full English and Vietnamese language support with seamless toggling.
- **Premium Responsive UI**: A beautiful, modern dark theme (Premium Dark Theme Design System) utilizing glassmorphism, responsive grids, full-width progress bars, and subtle micro-interactions. Fully optimized for all screen sizes (desktop, tablet, and mobile).

## 📁 Project Structure

- `index.html` - The main SPA view, navigator panel, results screen, and modals.
- `style.css` - Custom styling, layout, responsive design, and animations.
- `app.js` - Main application controller, event mapping, routing, and i18n logic.
- `storage.js` - Data persistence layer utilizing `localStorage` for exams and attempts.
- `importer.js` - Flexible parsers for JSON and TXT exam files.
- `exam-engine.js` - Logic for exam navigation, state, auto-save, and timers.
- `scorer.js` - Grading logic and score calculation.
- `sample-exam.json` - Sample exam data in structured JSON format.
- `sample-exam.txt` - Sample exam data in a simpler TXT template format.

## 🚀 Getting Started

1. Clone or download the repository.
2. Open `index.html` in your favorite modern web browser.
3. Start practicing with the provided sample exams or import your own using the `.json` or `.txt` templates!

## 📝 Creating Custom Exams

You can create custom exams using a simple text file (`.txt`) format or structured JSON. Please refer to `sample-exam.txt` and `sample-exam.json` for formatting guidelines and examples.

## 📱 Mobile Support

Dexams is fully responsive and meticulously optimized for mobile devices, offering a native-app-like experience with touch-friendly navigation, perfect text wrapping, and elegant UI scaling.
