import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, RotateCcw, Check, TableIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { storage, DEFAULT_SCORING_CHART, ScoringChart } from "@/lib/storage";
import { parsePdfScoringChart } from "@/lib/scoring-chart-parser";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const ScoringChartPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const existingChart = storage.getScoringChart();
  const currentChart = existingChart || DEFAULT_SCORING_CHART;

  const handleFileUpload = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting scoring chart upload process...');
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF parsing timed out after 30 seconds')), 30000);
      });
      
      const parsePromise = parsePdfScoringChart(file);
      const result = await Promise.race([parsePromise, timeoutPromise]);
      
      console.log('Scoring chart parsed successfully:', result.chart.entries.length, 'entries');
      
      storage.saveScoringChart(result.chart);
      console.log('Scoring chart saved to storage');
      
      toast({
        title: "Scoring chart uploaded!",
        description: `Loaded ${result.chart.entries.length} score conversion entries`,
      });
    } catch (error) {
      console.error('Failed to parse scoring chart PDF:', error);
      toast({
        title: "Failed to parse PDF",
        description: error instanceof Error ? error.message : "Could not extract scoring chart data from PDF",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleUseDefault = () => {
    storage.saveScoringChart({
      ...DEFAULT_SCORING_CHART,
      lastUpdated: new Date().toISOString()
    });
    toast({
      title: "Default chart loaded",
      description: "Using official e-asTTle scoring chart",
    });
    // Force re-render
    window.location.reload();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isLoading
  });

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
            <h1 className="text-3xl font-bold text-foreground">Score Conversion Chart</h1>
            <p className="text-muted-foreground">
              Manage the e-asTTle score to curriculum level conversion table
            </p>
          </div>
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 gentle-shadow">
            <div className="flex items-center gap-3 mb-4">
              <TableIcon className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Current Chart</h2>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">
                  {currentChart.isCustom ? 'Custom Chart' : 'Official e-asTTle Chart'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentChart.entries.length} score conversions loaded
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(currentChart.lastUpdated).toLocaleDateString()}
              </p>
            </div>

            {/* Quick Preview */}
            <div className="border rounded-xl overflow-hidden mb-4">
              <div className="bg-muted/50 p-2 text-xs font-medium grid grid-cols-4 text-center">
                <span>Total Score</span>
                <span>Scale Score</span>
                <span>Error (±)</span>
                <span>Level</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {currentChart.entries.slice(0, 10).map((entry, idx) => (
                  <div 
                    key={idx} 
                    className="grid grid-cols-4 text-center p-2 text-sm border-t border-border"
                  >
                    <span>{entry.totalScore}</span>
                    <span>{entry.scaleScore}</span>
                    <span>±{entry.errorMargin}</span>
                    <span className="font-medium text-primary">{entry.curriculumLevel}</span>
                  </div>
                ))}
                {currentChart.entries.length > 10 && (
                  <div className="text-center p-2 text-xs text-muted-foreground border-t">
                    ... and {currentChart.entries.length - 10} more entries
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleUseDefault}
              variant="outline"
              className="w-full rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default Chart
            </Button>
          </Card>
        </motion.div>

        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 gentle-shadow">
            <h2 className="text-xl font-semibold text-foreground mb-4">Upload Custom Chart</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a PDF with an updated scoring conversion table if the official chart changes
            </p>

            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              {isLoading ? (
                <p className="text-muted-foreground">Processing PDF...</p>
              ) : isDragActive ? (
                <p className="text-primary font-medium">Drop the PDF here</p>
              ) : (
                <div>
                  <p className="text-foreground font-medium mb-1">
                    Drag & drop a PDF here, or click to select
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF files only
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 gentle-shadow bg-muted/20">
            <h3 className="font-semibold text-foreground mb-2">How it works</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                The scoring chart converts raw rubric scores (7-44+) to official curriculum levels
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                Each level (1B through 6A+) corresponds to expected year-level performance
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                Scale scores (aWs) provide a standardized measure with error margins
              </li>
            </ul>
          </Card>
        </motion.div>

        {/* Back Button */}
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="w-full h-12 border-2 rounded-xl"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default ScoringChartPage;
