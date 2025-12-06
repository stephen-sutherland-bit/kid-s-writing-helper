import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Download, Check, Award } from "lucide-react";
import { storage, DEFAULT_SCORING_CHART } from "@/lib/storage";
import { getLevelFromScore, calculateTotalScore, lookupScaleScore } from "@/lib/scoring";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FeedbackMode = 'student' | 'teacher' | 'parent' | 'formal';

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

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('student');

  const assessment = id ? storage.getAssessment(id) : null;

  useEffect(() => {
    if (!assessment) {
      navigate("/");
    }
  }, [assessment, navigate]);

  if (!assessment) return null;

  const totalScore = Object.values(assessment.scores).reduce((a, b) => a + b, 0);
  const averageScore = totalScore / Object.keys(assessment.scores).length;
  
  // Get the official curriculum level from scoring chart
  const scoreConversion = lookupScaleScore(totalScore);
  const maxPossibleScore = Object.keys(assessment.scores).length * 8;
  
  // Handle both old and new feedback formats
  let currentFeedback = '';
  if (typeof assessment.feedback === 'string') {
    // Old format - single string feedback
    currentFeedback = assessment.feedback;
  } else if ('student' in assessment.feedback) {
    // New format - 4 modes
    currentFeedback = assessment.feedback[feedbackMode];
  } else if ('simple' in assessment.feedback) {
    // Old 3-mode format
    const oldMode = feedbackMode === 'student' ? 'simple' : feedbackMode === 'teacher' ? 'report' : feedbackMode === 'parent' ? 'report' : 'advanced';
    currentFeedback = assessment.feedback[oldMode as 'simple' | 'report' | 'advanced'];
  }

  const handleCopy = async () => {
    const text = `
e-asTTle Writing Assessment Results
Generated: ${new Date(assessment.timestamp).toLocaleString()}

Overall Assessment:
Total Score: ${totalScore}/${maxPossibleScore}
${scoreConversion ? `Scale Score: ${scoreConversion.scaleScore} aWs (±${scoreConversion.errorMargin})
Curriculum Level: ${scoreConversion.curriculumLevel}` : ''}

Category Scores:
${Object.entries(assessment.scores).map(([cat, score]) => 
  `${cat}: ${getLevelFromScore(score)} (${score}/8)`
).join('\n')}

Average Score: ${averageScore.toFixed(1)}/8

Feedback (${feedbackMode}):
${currentFeedback}
    `.trim();

    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied to clipboard! ✓",
      description: "Assessment results have been copied",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = `
e-asTTle Writing Assessment Results
Generated: ${new Date(assessment.timestamp).toLocaleString()}

OVERALL ASSESSMENT
==================
Total Raw Score: ${totalScore}/${maxPossibleScore}
${scoreConversion ? `Scale Score: ${scoreConversion.scaleScore} aWs (±${scoreConversion.errorMargin})
Curriculum Level: ${scoreConversion.curriculumLevel}` : ''}

CATEGORY SCORES
===============
${Object.entries(assessment.scores).map(([cat, score]) => 
  `${cat}: ${getLevelFromScore(score)} (${score}/8)`
).join('\n')}

Average Score: ${averageScore.toFixed(1)}/8

STUDENT WRITING
===============
${assessment.text}

FEEDBACK (${feedbackMode.toUpperCase()})
${currentFeedback}
    `.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded! ✓",
      description: "Assessment saved to your device",
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assessment Results</h1>
            <p className="text-muted-foreground">
              {new Date(assessment.timestamp).toLocaleDateString('en-NZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Overall Assessment Card */}
        {scoreConversion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="p-6 gentle-shadow bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Overall Assessment</h2>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-card p-4 rounded-xl border border-border text-center">
                  <div className="text-sm text-muted-foreground mb-1">Total Score</div>
                  <div className="text-2xl font-bold text-foreground">
                    {totalScore}<span className="text-lg text-muted-foreground">/{maxPossibleScore}</span>
                  </div>
                </div>
                
                <div className="bg-card p-4 rounded-xl border border-border text-center">
                  <div className="text-sm text-muted-foreground mb-1">Scale Score</div>
                  <div className="text-2xl font-bold text-foreground">
                    {scoreConversion.scaleScore}
                  </div>
                  <div className="text-xs text-muted-foreground">±{scoreConversion.errorMargin} aWs</div>
                </div>
                
                <div className="bg-primary p-4 rounded-xl text-center">
                  <div className="text-sm text-primary-foreground/80 mb-1">Curriculum Level</div>
                  <div className="text-3xl font-bold text-primary-foreground">
                    {scoreConversion.curriculumLevel}
                  </div>
                  <div className="text-xs text-primary-foreground/70 mt-1">
                    {levelToYearExpectation[scoreConversion.curriculumLevel] || 'Year level varies'}
                  </div>
                </div>
              </div>

              {/* Level Progress Bar */}
              <div className="bg-card p-4 rounded-xl border border-border">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>1B</span>
                  <span>2B</span>
                  <span>3B</span>
                  <span>4B</span>
                  <span>5B</span>
                  <span>6B+</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (totalScore / 44) * 100)}%` }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  />
                </div>
                <div className="text-center mt-2 text-sm text-muted-foreground">
                  Current level: <span className="font-semibold text-primary">{scoreConversion.curriculumLevel}</span>
                  <span className="ml-1">({levelToYearExpectation[scoreConversion.curriculumLevel] || ''})</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Scores Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 gentle-shadow bg-gradient-to-br from-card to-muted/20">
            <h2 className="text-xl font-semibold text-foreground mb-4">Rubric Scores</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(assessment.scores).map(([category, score], idx) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card p-4 rounded-xl border-2 border-border"
                >
                  <div className="text-sm text-muted-foreground mb-1">{category}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {getLevelFromScore(score)}
                    </span>
                    <span className="text-sm text-muted-foreground">({score}/8)</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(score / 8) * 100}%` }}
                      transition={{ delay: idx * 0.05 + 0.2, duration: 0.5 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-foreground">Average Score</span>
                <span className="text-3xl font-bold text-primary">
                  {averageScore.toFixed(1)}/8
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 gentle-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Feedback</h2>
              <Select value={feedbackMode} onValueChange={(v) => setFeedbackMode(v as FeedbackMode)}>
                <SelectTrigger className="w-[200px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">For Students</SelectItem>
                  <SelectItem value="teacher">For Teachers</SelectItem>
                  <SelectItem value="parent">For Parents</SelectItem>
                  <SelectItem value="formal">Formal Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/30 p-6 rounded-xl">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-foreground">
                  {currentFeedback}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-2"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy Results"}
              </Button>

              <Button
                onClick={handleDownload}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Download as TXT
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Student Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 gentle-shadow">
            <h2 className="text-xl font-semibold text-foreground mb-4">Student Writing</h2>
            <div className="bg-muted/30 p-6 rounded-xl">
              <p className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">
                {assessment.text}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate("/assess")}
            className="flex-1 h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl"
          >
            New Assessment
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex-1 h-12 border-2 rounded-xl"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
