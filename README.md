# e-asTTle Writing Helper

A warm, Montessori-inspired web application for assessing student writing using the e-asTTle rubric. Everything runs client-side with no backend required.

## 🎯 Features

- **Custom Rubric Upload**: Upload PDF rubrics or use the default e-asTTle structure
- **Photo OCR**: Take photos or upload images of handwritten work
- **Automatic Scoring**: Rule-based scoring across 7 rubric categories
- **Three Feedback Modes**:
  - Simple: Kid-friendly, encouraging feedback
  - Report: Teacher-ready assessment summaries
  - Advanced: Formal, academic analysis
- **Offline-First**: All processing happens in the browser
- **Privacy-Focused**: No data sent to servers
- **Mobile-Friendly**: Works on phones, tablets, and desktops

## 📋 Rubric Categories

1. Ideas
2. Structure
3. Organisation
4. Vocabulary
5. Sentence Style
6. Punctuation
7. Spelling

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **OCR**: Tesseract.js (browser-based)
- **PDF Parsing**: pdfjs-dist
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui
- **Storage**: localStorage
- **Routing**: React Router

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) to view the app.

### Build

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run build
# Then deploy the dist/ folder to GitHub Pages
```

## 📱 How to Use

1. **Upload Rubric** (optional): Go to Rubric page and upload your custom PDF, or use the default
2. **Start Assessment**: Click "Start New Assessment" on the home page
3. **Capture Writing**: Take a photo or upload an image of student writing
4. **Edit Text**: Review and edit the OCR text if needed
5. **Score Writing**: Click to generate scores and feedback
6. **View Results**: See scores, choose feedback mode, copy or download results

## 🎨 Design Philosophy

Built with Montessori principles in mind:
- Warm, inviting color palette (sky blue, soft pink, sage green, sunshine yellow)
- Rounded, friendly typography (Nunito font)
- Gentle animations and transitions
- Non-judgmental, encouraging language
- Clean, uncluttered interface

## 🔒 Privacy & Data

- All processing happens in your browser
- No data sent to external servers
- Rubric and assessments stored in localStorage only
- Works offline after initial load

## 📝 Notes

- OCR works best with clear, well-lit photos
- Supported image formats: JPEG, PNG, WebP
- Maximum image size: 10MB
- PDF parsing currently uses default rubric structure (full parsing can be implemented)

## 🤝 Contributing

This is an open-source educational tool. Contributions welcome!

## 📄 License

MIT License - feel free to use and modify for educational purposes.

## 🌟 Acknowledgments

- e-asTTle writing rubric by the New Zealand Ministry of Education
- Tesseract.js for browser-based OCR
- shadcn/ui for beautiful components
