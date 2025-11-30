import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Download, Check } from "lucide-react";
import { storage } from "@/lib/storage";
import { getLevelFromScore } from "@/lib/scoring";
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

Scores:
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

SCORES
======
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
