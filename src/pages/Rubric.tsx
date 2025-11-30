import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { storage, DEFAULT_RUBRIC } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { parsePdfRubric } from "@/lib/pdf-parser";

const Rubric = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const currentRubric = storage.getRubric();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File upload triggered, file:', file?.name);
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    console.log('Starting upload process...');

    try {
      toast({
        title: "Parsing PDF...",
        description: "Extracting rubric categories and criteria from your PDF",
      });

      // Parse the PDF to extract rubric structure with timeout
      const parsePromise = parsePdfRubric(file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF parsing timed out after 30 seconds')), 30000)
      );
      
      const { rubric, rawText } = await Promise.race([parsePromise, timeoutPromise]) as { rubric: any; rawText: string };
      console.log('PDF parsed successfully, categories:', rubric.categories.length);
      
      // Add rawText for AI reference
      rubric.rawText = rawText;
      rubric.lastUpdated = new Date().toISOString();

      storage.saveRubric(rubric);
      console.log('Rubric saved to storage');

      toast({
        title: "Rubric saved successfully! ✓",
        description: `${rubric.categories.length} categories loaded from PDF`,
      });

      console.log('Navigating to home in 1.5s...');
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error('PDF parsing error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error processing your rubric. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const useDefaultRubric = () => {
    storage.saveRubric(DEFAULT_RUBRIC);
    toast({
      title: "Default rubric loaded",
      description: "e-asTTle writing rubric is ready to use",
    });
    setTimeout(() => navigate("/"), 1000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
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
            <h1 className="text-3xl font-bold text-foreground">Rubric Management</h1>
            <p className="text-muted-foreground">Upload or configure your assessment rubric</p>
          </div>
        </div>

        {/* Current Status */}
        {currentRubric && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 border-2 border-accent/50 bg-accent/10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Current Rubric</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-foreground">
                      {currentRubric.categories.length} assessment categories loaded
                    </p>
                    <p className="text-muted-foreground">
                      Last updated: {new Date(currentRubric.lastUpdated).toLocaleDateString('en-NZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="pt-2 space-y-1">
                      {currentRubric.categories.map((cat, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          • {cat.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Upload Section */}
        <Card className="p-8 gentle-shadow">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Upload Custom Rubric</h2>
              <p className="text-sm text-muted-foreground">
                Upload a PDF of your e-asTTle rubric to customize the assessment categories
              </p>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4 hover:border-primary/50 transition-colors">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="font-medium text-foreground">Drop your rubric PDF here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="rubric-upload"
              />
              <label htmlFor="rubric-upload">
                <Button
                  asChild
                  disabled={uploading}
                  className="rounded-xl"
                >
                  <span>
                    {uploading ? "Processing..." : "Choose PDF File"}
                  </span>
                </Button>
              </label>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              onClick={useDefaultRubric}
              variant="outline"
              className="w-full h-12 border-2 rounded-xl"
              disabled={uploading}
            >
              Use Default e-asTTle Rubric
            </Button>

            <div className="bg-muted/30 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-foreground">AI-Powered Assessment</p>
                <p className="text-muted-foreground">
                  Upload your e-asTTle rubric PDF and the app will extract categories and use AI to score 
                  student writing against the actual criteria in your rubric.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Rubric;
