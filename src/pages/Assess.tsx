import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Upload, Loader2, Sparkles, FileImage } from "lucide-react";
import { extractTextFromImage, validateImageFile, OcrProgress } from "@/lib/ocr";
import { scoreWriting } from "@/lib/scoring";
import { generateFeedback } from "@/lib/feedback";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";

const Assess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [ocrText, setOcrText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>({ status: "", progress: 0 });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    try {
      validateImageFile(file);

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);

      setIsProcessing(true);
      setOcrProgress({ status: "Initializing OCR...", progress: 0 });

      const text = await extractTextFromImage(file, setOcrProgress);

      if (!text.trim()) {
        throw new Error("No text detected in the image. Please try a clearer photo.");
      }

      setOcrText(text);
      storage.saveLastOcrText(text);

      toast({
        title: "Text extracted successfully! ✓",
        description: "You can now edit the text or proceed to score the writing.",
      });
    } catch (error: any) {
      toast({
        title: "OCR failed",
        description: error.message || "Failed to extract text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress({ status: "", progress: 0 });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleScoreWriting = () => {
    if (!ocrText.trim()) {
      toast({
        title: "No text to score",
        description: "Please upload an image or enter text first.",
        variant: "destructive",
      });
      return;
    }

    // Score the writing
    const scores = scoreWriting(ocrText);

    // Generate all feedback modes
    const feedback = {
      simple: generateFeedback(scores, ocrText, 'simple'),
      report: generateFeedback(scores, ocrText, 'report'),
      advanced: generateFeedback(scores, ocrText, 'advanced'),
    };

    // Save assessment
    const assessment = {
      id: Date.now().toString(),
      text: ocrText,
      scores,
      feedback,
      timestamp: new Date().toISOString(),
    };

    storage.saveAssessment(assessment);

    // Navigate to results
    navigate(`/results/${assessment.id}`);
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleImageUpload(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      toast({
        title: "File rejected",
        description: error?.message || "Please upload a valid image file",
        variant: "destructive",
      });
    }
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
            <h1 className="text-3xl font-bold text-foreground">New Assessment</h1>
            <p className="text-muted-foreground">Upload a photo of student writing</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="p-6 gentle-shadow">
            <h2 className="text-xl font-semibold text-foreground mb-4">Upload Writing Sample</h2>

            {imagePreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 rounded-xl overflow-hidden border-2 border-border"
              >
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
              </motion.div>
            )}

            {/* Drag and Drop Zone */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-8 mb-4 text-center cursor-pointer
                transition-all duration-200
                ${isDragActive 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <FileImage className={`w-12 h-12 mx-auto mb-3 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </motion.div>
              <p className="font-medium text-foreground mb-1">
                {isDragActive ? "Drop your image here!" : "Drag & drop an image here"}
              </p>
              <p className="text-sm text-muted-foreground">
                or use the buttons below
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                <Camera className="w-5 h-5 mr-2" />
                Take Photo
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                variant="outline"
                className="w-full h-14 border-2 rounded-xl"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Image
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{ocrProgress.status}</span>
                  </div>
                  <Progress value={ocrProgress.progress * 100} className="h-2" />
                </motion.div>
              )}
            </div>
          </Card>

          {/* Text Editor Section */}
          <Card className="p-6 gentle-shadow">
            <h2 className="text-xl font-semibold text-foreground mb-4">Extracted Text</h2>
            <Textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Text will appear here after OCR, or you can type/paste text directly..."
              className="min-h-[250px] text-base rounded-xl resize-none"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground mt-2">
              You can edit the text before scoring if needed
            </p>
          </Card>
        </div>

        {/* Score Button */}
        {ocrText.trim() && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={handleScoreWriting}
              className="w-full h-16 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground rounded-xl gentle-shadow"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Score Writing & Generate Feedback
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Assess;
