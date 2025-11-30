// Feedback generation in three tones

export type FeedbackMode = 'simple' | 'report' | 'advanced';

export function generateFeedback(scores: Record<string, number>, text: string, mode: FeedbackMode): string {
  const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  // Identify strengths and areas for improvement
  Object.entries(scores).forEach(([category, score]) => {
    if (score >= 6) {
      strengths.push(category);
    } else if (score <= 3) {
      improvements.push(category);
    }
  });
  
  switch (mode) {
    case 'simple':
      return generateSimpleFeedback(avgScore, strengths[0]);
      
    case 'report':
      return generateReportFeedback(scores, strengths, improvements);
      
    case 'advanced':
      return generateAdvancedFeedback(scores, strengths, improvements, text);
      
    default:
      return generateSimpleFeedback(avgScore, strengths[0]);
  }
}

function generateSimpleFeedback(avgScore: number, topStrength?: string): string {
  if (avgScore >= 6) {
    return "Wow! Your writing is really wonderful and shows great thinking! 🌟";
  } else if (avgScore >= 4) {
    if (topStrength) {
      return `Great work! Your ${topStrength.toLowerCase()} is really good! Keep practicing! 😊`;
    }
    return "Nice job! Your writing is getting better and better! Keep it up! 😊";
  } else {
    return "You're doing great by practicing your writing! Every story makes you better! 🌈";
  }
}

function generateReportFeedback(scores: Record<string, number>, strengths: string[], improvements: string[]): string {
  let feedback = "**Assessment Summary**\n\n";
  
  // Start with strengths
  if (strengths.length > 0) {
    feedback += "**Strengths:**\n";
    feedback += `The student demonstrates good ability in ${strengths.join(", ").toLowerCase()}. `;
    
    if (strengths.includes("Ideas")) {
      feedback += "Ideas are well-developed and show clear thinking. ";
    }
    if (strengths.includes("Vocabulary")) {
      feedback += "Word choice is varied and appropriate. ";
    }
    if (strengths.includes("Structure")) {
      feedback += "The writing is well-organized with clear structure. ";
    }
  }
  
  feedback += "\n\n";
  
  // Then improvements (gentle language)
  if (improvements.length > 0) {
    feedback += "**Areas for Growth:**\n";
    feedback += `With focused practice, the student can strengthen ${improvements.join(", ").toLowerCase()}. `;
    
    if (improvements.includes("Spelling")) {
      feedback += "Encourage regular spelling practice and word study. ";
    }
    if (improvements.includes("Punctuation")) {
      feedback += "Review punctuation rules and model correct usage. ";
    }
    if (improvements.includes("Organisation")) {
      feedback += "Practice planning writing with clear beginnings, middles, and endings. ";
    }
  }
  
  feedback += "\n\n**Next Steps:**\n";
  feedback += "Continue to encourage regular writing practice and celebrate progress. Focus on one or two areas at a time for improvement.";
  
  return feedback;
}

function generateAdvancedFeedback(scores: Record<string, number>, strengths: string[], improvements: string[], text: string): string {
  let feedback = "**Advanced Writing Analysis**\n\n";
  
  feedback += "**Quantitative Assessment:**\n";
  Object.entries(scores).forEach(([category, score]) => {
    const level = ["1B", "1P", "1A", "2B", "2P", "2A", "3B", "3P", "3A"][score];
    feedback += `- ${category}: Level ${level} (Score: ${score}/8)\n`;
  });
  
  feedback += "\n**Qualitative Analysis:**\n\n";
  
  // Ideas and Content
  feedback += "**Ideas and Content:** ";
  if (scores.Ideas >= 6) {
    feedback += "The writer demonstrates sophisticated thinking with well-developed ideas that show depth and complexity. ";
  } else if (scores.Ideas >= 4) {
    feedback += "Ideas are present and show developing understanding, though further elaboration would strengthen the piece. ";
  } else {
    feedback += "Ideas require further development. Encourage the writer to explore topics more deeply through questioning and brainstorming. ";
  }
  
  // Structure and Organisation
  feedback += "\n\n**Structure and Organisation:** ";
  if (scores.Structure >= 6 || scores.Organisation >= 6) {
    feedback += "The writing exhibits strong organizational coherence with effective use of paragraphing and logical progression of ideas. ";
  } else {
    feedback += "Structural elements require attention. Explicit instruction in text structure and organizational frameworks would be beneficial. ";
  }
  
  // Language Features
  feedback += "\n\n**Language Features:** ";
  const languageScore = (scores.Vocabulary + scores["Sentence Style"]) / 2;
  if (languageScore >= 6) {
    feedback += "The writer demonstrates sophisticated control of language features, including varied vocabulary and complex sentence structures. ";
  } else {
    feedback += "Language use is developing. Encourage exposure to rich texts and explicit vocabulary instruction. ";
  }
  
  // Surface Features
  feedback += "\n\n**Surface Features (Spelling and Punctuation):** ";
  const surfaceScore = (scores.Spelling + scores.Punctuation) / 2;
  if (surfaceScore >= 6) {
    feedback += "Surface features are well-controlled with accurate spelling and punctuation throughout. ";
  } else {
    feedback += "Surface features require attention through systematic instruction and regular editing practice. ";
  }
  
  feedback += "\n\n**Pedagogical Recommendations:**\n";
  if (improvements.length > 0) {
    improvements.forEach(area => {
      feedback += `- Implement targeted instruction in ${area.toLowerCase()} through scaffolded activities and modeled writing.\n`;
    });
  }
  
  return feedback;
}
