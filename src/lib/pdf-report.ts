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

const audienceLabels: Record<FeedbackAudience, string> = {
  student: 'For Students',
  teacher: 'For Teachers',
  parent: 'For Parents'
};

const depthLabels: Record<FeedbackDepth, string> = {
  simple: 'Quick Summary',
  standard: 'Standard',
  comprehensive: 'Comprehensive'
};

export function generateAssessmentPDF(options: PDFReportOptions): void {
  const { assessment, feedbackAudience, feedbackDepth, currentFeedback } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  
  // Colors
  const primaryColor: [number, number, number] = [74, 124, 155]; // Soft blue
  const textColor: [number, number, number] = [51, 51, 51]; // Dark gray
  const lightBg: [number, number, number] = [248, 250, 252]; // Light background
  
  // Calculate scores
  const totalScore = Object.values(assessment.scores).reduce((a, b) => a + b, 0);
  const averageScore = totalScore / Object.keys(assessment.scores).length;
  const maxPossibleScore = Object.keys(assessment.scores).length * 8;
  const scoreConversion = lookupScaleScore(totalScore);
  
  let yPos = margin;
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Writing Assessment Report', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const assessmentDate = new Date(assessment.timestamp).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(assessmentDate, pageWidth / 2, 32, { align: 'center' });
  
  yPos = 55;
  
  // Student Details Box
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Student:', margin + 8, yPos + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(assessment.studentName || 'Not specified', margin + 8, yPos + 19);
  
  yPos += 35;
  
  // Overall Results Section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Assessment', margin, yPos);
  
  yPos += 8;
  
  // Results boxes in a row
  const boxWidth = (contentWidth - 10) / 3;
  const boxHeight = 35;
  
  // Box 1: Total Score
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, yPos, boxWidth, boxHeight, 3, 3, 'F');
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Score', margin + boxWidth / 2, yPos + 10, { align: 'center' });
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalScore}/${maxPossibleScore}`, margin + boxWidth / 2, yPos + 25, { align: 'center' });
  
  // Box 2: Scale Score
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin + boxWidth + 5, yPos, boxWidth, boxHeight, 3, 3, 'F');
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Scale Score', margin + boxWidth + 5 + boxWidth / 2, yPos + 10, { align: 'center' });
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  if (scoreConversion) {
    doc.text(`${scoreConversion.scaleScore} aWs`, margin + boxWidth + 5 + boxWidth / 2, yPos + 22, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`±${scoreConversion.errorMargin}`, margin + boxWidth + 5 + boxWidth / 2, yPos + 30, { align: 'center' });
  } else {
    doc.text('N/A', margin + boxWidth + 5 + boxWidth / 2, yPos + 25, { align: 'center' });
  }
  
  // Box 3: Curriculum Level (highlighted)
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin + (boxWidth + 5) * 2, yPos, boxWidth, boxHeight, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Curriculum Level', margin + (boxWidth + 5) * 2 + boxWidth / 2, yPos + 10, { align: 'center' });
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  if (scoreConversion) {
    doc.text(scoreConversion.curriculumLevel, margin + (boxWidth + 5) * 2 + boxWidth / 2, yPos + 26, { align: 'center' });
  } else {
    doc.text('N/A', margin + (boxWidth + 5) * 2 + boxWidth / 2, yPos + 26, { align: 'center' });
  }
  
  yPos += boxHeight + 5;
  
  // Year level expectation
  if (scoreConversion) {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const yearExpectation = levelToYearExpectation[scoreConversion.curriculumLevel] || '';
    doc.text(`Expected level: ${yearExpectation}`, pageWidth / 2, yPos + 5, { align: 'center' });
  }
  
  yPos += 18;
  
  // Category Scores Table
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Scores', margin, yPos);
  
  yPos += 5;
  
  const tableData = Object.entries(assessment.scores).map(([category, score]) => [
    category,
    getLevelFromScore(score),
    `${score}/8`
  ]);
  
  // Add average row
  tableData.push(['Average', '', `${averageScore.toFixed(1)}/8`]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Level', 'Score']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 10
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    styles: {
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'center', cellWidth: 30 }
    }
  });
  
  // @ts-ignore - jspdf-autotable adds this property
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Check if we need a new page for feedback
  if (yPos > 200) {
    doc.addPage();
    yPos = margin;
  }
  
  // Feedback Section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Feedback', margin, yPos);
  
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${audienceLabels[feedbackAudience]} - ${depthLabels[feedbackDepth]})`, margin + 50, yPos);
  
  yPos += 8;
  
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, yPos, contentWidth, 45, 3, 3, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Wrap feedback text
  const feedbackLines = doc.splitTextToSize(currentFeedback, contentWidth - 16);
  const maxLines = 8; // Limit lines to fit in box
  const displayLines = feedbackLines.slice(0, maxLines);
  if (feedbackLines.length > maxLines) {
    displayLines[maxLines - 1] += '...';
  }
  
  doc.text(displayLines, margin + 8, yPos + 10);
  
  yPos += 55;
  
  // Check if we need a new page for student writing
  if (yPos > 200) {
    doc.addPage();
    yPos = margin;
  }
  
  // Student Writing Section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Student's Writing", margin, yPos);
  
  yPos += 8;
  
  doc.setFillColor(...lightBg);
  
  // Calculate box height based on text
  doc.setFontSize(9);
  const writingLines = doc.splitTextToSize(assessment.text, contentWidth - 16);
  const maxWritingLines = 20;
  const displayWritingLines = writingLines.slice(0, maxWritingLines);
  if (writingLines.length > maxWritingLines) {
    displayWritingLines[maxWritingLines - 1] += '...';
  }
  
  const writingBoxHeight = Math.min(80, displayWritingLines.length * 4 + 16);
  doc.roundedRect(margin, yPos, contentWidth, writingBoxHeight, 3, 3, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  doc.text(displayWritingLines, margin + 8, yPos + 10);
  
  yPos += writingBoxHeight + 15;
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Assessment completed on ${assessmentDate} • e-asTTle Writing Assessment`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  
  // Save the PDF
  const studentNameSlug = assessment.studentName 
    ? assessment.studentName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : 'student';
  const dateSlug = new Date(assessment.timestamp).toISOString().split('T')[0];
  doc.save(`writing-assessment-${studentNameSlug}-${dateSlug}.pdf`);
}
