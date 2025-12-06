import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Assessment, FeedbackAudience, FeedbackDepth } from './storage';
import { getLevelFromScore, lookupScaleScore } from './scoring';

interface PDFReportOptions {
  assessment: Assessment;
  feedbackAudience: FeedbackAudience;
  feedbackDepth: FeedbackDepth;
  currentFeedback: string;
}

const levelToYearExpectation: Record<string, string> = {
  '1B': 'Year 1 beginning',
  '1P': 'Year 1-2 expected',
  '1A': 'Year 2 expected',
  '2B': 'Year 2-3 expected',
  '2P': 'Year 3-4 expected',
  '2A': 'Year 4 expected',
  '3B': 'Year 4-5 expected',
  '3P': 'Year 5-6 expected',
  '3A': 'Year 6 expected',
  '4B': 'Year 6-7 expected',
  '4P': 'Year 7-8 expected',
  '4A': 'Year 8 expected',
  '5B': 'Year 8-9 expected',
  '5P': 'Year 9-10 expected',
  '5A': 'Year 10 expected',
  '6B': 'Year 10-11 expected',
  '>6B': 'Above Year 11'
};

export function generateAssessmentPDF(options: PDFReportOptions): void {
  const { assessment, currentFeedback } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  // Colors - purple/violet education theme
  const headerColor: [number, number, number] = [88, 28, 135]; // Deep purple
  const accentColor: [number, number, number] = [139, 47, 201]; // Vibrant purple
  const textColor: [number, number, number] = [45, 45, 60]; // Dark slate
  const mutedColor: [number, number, number] = [107, 100, 128]; // Purple-gray
  const borderColor: [number, number, number] = [209, 200, 225]; // Light purple border
  const bgColor: [number, number, number] = [248, 245, 252]; // Light purple tint
  
  // Calculate scores
  const totalScore = Object.values(assessment.scores).reduce((a, b) => a + b, 0);
  const averageScore = totalScore / Object.keys(assessment.scores).length;
  const maxPossibleScore = Object.keys(assessment.scores).length * 8;
  const scoreConversion = lookupScaleScore(totalScore);
  
  const assessmentDate = new Date(assessment.timestamp).toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let yPos = margin;
  
  // === HEADER SECTION ===
  doc.setFillColor(...headerColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Writing Assessment Report', margin, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(assessmentDate, pageWidth - margin, 22, { align: 'right' });
  
  yPos = 45;
  
  // === STUDENT INFO BAR ===
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('STUDENT NAME', margin, yPos);
  
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(assessment.studentName || 'Not specified', margin, yPos + 8);
  
  yPos += 18;
  
  doc.setDrawColor(...borderColor);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 12;
  
  // === RESULTS SUMMARY ===
  doc.setTextColor(...headerColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSESSMENT RESULTS', margin, yPos);
  
  yPos += 10;
  
  // Three-column results layout
  const colWidth = (contentWidth - 20) / 3;
  
  // Column 1: Raw Score
  doc.setFillColor(...bgColor);
  doc.roundedRect(margin, yPos, colWidth, 40, 2, 2, 'F');
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('RAW SCORE', margin + colWidth / 2, yPos + 10, { align: 'center' });
  doc.setTextColor(...textColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalScore}`, margin + colWidth / 2, yPos + 26, { align: 'center' });
  doc.setTextColor(...mutedColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`of ${maxPossibleScore}`, margin + colWidth / 2, yPos + 34, { align: 'center' });
  
  // Column 2: Scale Score
  doc.setFillColor(...bgColor);
  doc.roundedRect(margin + colWidth + 10, yPos, colWidth, 40, 2, 2, 'F');
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('SCALE SCORE (aWs)', margin + colWidth + 10 + colWidth / 2, yPos + 10, { align: 'center' });
  doc.setTextColor(...textColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  if (scoreConversion) {
    doc.text(`${scoreConversion.scaleScore}`, margin + colWidth + 10 + colWidth / 2, yPos + 26, { align: 'center' });
    doc.setTextColor(...mutedColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`± ${scoreConversion.errorMargin}`, margin + colWidth + 10 + colWidth / 2, yPos + 34, { align: 'center' });
  } else {
    doc.text('—', margin + colWidth + 10 + colWidth / 2, yPos + 26, { align: 'center' });
  }
  
  // Column 3: Curriculum Level (highlighted)
  doc.setFillColor(...accentColor);
  doc.roundedRect(margin + (colWidth + 10) * 2, yPos, colWidth, 40, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CURRICULUM LEVEL', margin + (colWidth + 10) * 2 + colWidth / 2, yPos + 10, { align: 'center' });
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  if (scoreConversion) {
    doc.text(scoreConversion.curriculumLevel, margin + (colWidth + 10) * 2 + colWidth / 2, yPos + 28, { align: 'center' });
    const yearExp = levelToYearExpectation[scoreConversion.curriculumLevel] || '';
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(yearExp, margin + (colWidth + 10) * 2 + colWidth / 2, yPos + 36, { align: 'center' });
  } else {
    doc.text('—', margin + (colWidth + 10) * 2 + colWidth / 2, yPos + 28, { align: 'center' });
  }
  
  yPos += 52;
  
  // === CATEGORY SCORES TABLE ===
  doc.setTextColor(...headerColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CATEGORY BREAKDOWN', margin, yPos);
  
  yPos += 5;
  
  const tableData = Object.entries(assessment.scores).map(([category, score]) => [
    category,
    getLevelFromScore(score),
    `${score} / 8`
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Level', 'Score']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: headerColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 9,
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: bgColor
    },
    styles: {
      lineColor: borderColor,
      lineWidth: 0.1
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 35 }
    }
  });
  
  // @ts-ignore - jspdf-autotable adds this property
  yPos = doc.lastAutoTable.finalY + 12;
  
  // === TEACHER NOTES SECTION ===
  doc.setTextColor(...headerColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TEACHER NOTES', margin, yPos);
  
  yPos += 6;
  
  // Calculate feedback box height dynamically
  doc.setFontSize(10);
  const feedbackLines = doc.splitTextToSize(currentFeedback, contentWidth - 12);
  const feedbackBoxHeight = Math.max(30, Math.min(60, feedbackLines.length * 5 + 12));
  
  doc.setFillColor(...bgColor);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, yPos, contentWidth, feedbackBoxHeight, 2, 2, 'FD');
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  
  // Limit lines to fit
  const maxFeedbackLines = Math.floor((feedbackBoxHeight - 10) / 5);
  const displayFeedbackLines = feedbackLines.slice(0, maxFeedbackLines);
  if (feedbackLines.length > maxFeedbackLines) {
    displayFeedbackLines[maxFeedbackLines - 1] = displayFeedbackLines[maxFeedbackLines - 1].slice(0, -3) + '...';
  }
  
  doc.text(displayFeedbackLines, margin + 6, yPos + 8);
  
  yPos += feedbackBoxHeight + 12;
  
  // Check if we need a new page for student writing
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }
  
  // === STUDENT WRITING SECTION ===
  doc.setTextColor(...headerColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT WRITING SAMPLE', margin, yPos);
  
  yPos += 6;
  
  doc.setFontSize(9);
  const writingLines = doc.splitTextToSize(assessment.text, contentWidth - 12);
  const maxWritingHeight = pageHeight - yPos - 25;
  const maxWritingLines = Math.floor(maxWritingHeight / 4);
  const displayWritingLines = writingLines.slice(0, maxWritingLines);
  if (writingLines.length > maxWritingLines) {
    displayWritingLines[maxWritingLines - 1] = displayWritingLines[maxWritingLines - 1].slice(0, -3) + '...';
  }
  
  const writingBoxHeight = Math.min(maxWritingHeight, displayWritingLines.length * 4 + 12);
  
  doc.setFillColor(...bgColor);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, yPos, contentWidth, writingBoxHeight, 2, 2, 'FD');
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  doc.text(displayWritingLines, margin + 6, yPos + 8);
  
  // === FOOTER ===
  const footerY = pageHeight - 10;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('e-asTTle Writing Assessment', margin, footerY);
  doc.text(assessmentDate, pageWidth - margin, footerY, { align: 'right' });
  
  // Save the PDF
  const studentNameSlug = assessment.studentName 
    ? assessment.studentName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : 'student';
  const dateSlug = new Date(assessment.timestamp).toISOString().split('T')[0];
  doc.save(`writing-assessment-${studentNameSlug}-${dateSlug}.pdf`);
}
