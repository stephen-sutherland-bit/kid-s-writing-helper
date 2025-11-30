import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Upload, Loader2, Sparkles, FileImage, Lightbulb } from "lucide-react";
import { extractTextFromImage, validateImageFile, OcrProgress } from "@/lib/ocr";
import { scoreWriting } from "@/lib/scoring";
import { generateFeedback } from "@/lib/feedback";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Assess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [ocrText, setOcrText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>({ status: "", progress: 0 });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      // Validate all files first
      files.forEach(validateImageFile);

      // Show all previews
      const previews: string[] = [];
      for (const file of files) {
        const reader = new FileReader();
        const preview = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        previews.push(preview);
      }
      setImagePreviews(previews);

      setIsProcessing(true);
      const extractedTexts: string[] = [];
      const confidences: number[] = [];

      // Process each image
      for (let i = 0; i < files.length; i++) {
        setOcrProgress({ 
          status: `Processing image ${i + 1} of ${files.length}...`, 
          progress: 0 
        });

        const result = await extractTextFromImage(files[i], setOcrProgress);
        
        if (result.text.trim()) {
          extractedTexts.push(result.text);
          confidences.push(result.confidence);
        }
      }

      if (extractedTexts.length === 0) {
        throw new Error("No text detected in any images. Please try clearer photos.");
      }

      // Combine all extracted text
      const combinedText = extractedTexts.join("\n\n");
      setOcrText(combinedText);
      storage.saveLastOcrText(combinedText);

      // Calculate average confidence
      const avgConfidence = Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
      setOcrConfidence(avgConfidence);

      toast({
        title: `Text extracted from ${extractedTexts.length} image${extractedTexts.length > 1 ? 's' : ''}! ✓`,
        description: `Confidence: ${avgConfidence}%. ${avgConfidence < 70 ? 'Please review and edit the text.' : 'You can now edit or score the writing.'}`,
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
    const files = Array.from(event.target.files || []);
    if (files.length > 0) handleImageUpload(files);
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
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing,
    onDrop: (acceptedFiles, fileRejections) => {
      if (acceptedFiles.length > 0) {
        handleImageUpload(acceptedFiles);
      } else if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const error = rejection.errors[0];
        
        let errorMessage = "Please upload valid image files";
        
        if (error.code === 'file-too-large') {
          errorMessage = "One or more images are too large. Please use images under 10MB.";
        } else if (error.code === 'file-invalid-type') {
          errorMessage = "Invalid file type. Please use JPEG, PNG, or WebP images.";
        }
        
        toast({
          title: "File rejected",
          description: errorMessage,
          variant: "destructive",
        });
      }
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

            {/* Photo Quality Tips */}
            <Alert className="mb-4 bg-muted/30 border-primary/20">
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Tips for best results:</strong> Use good lighting, hold camera steady and parallel to paper, 
                ensure dark pen on white paper, and minimize shadows.
              </AlertDescription>
            </Alert>

            {imagePreviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 space-y-2"
              >
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="rounded-xl overflow-hidden border-2 border-border">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover" />
                  </div>
                ))}
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
                {isDragActive ? "Drop your images here!" : "Drag & drop images here"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isDragActive ? "Release to upload" : "or use the buttons below • Multiple images supported"}
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
                multiple
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Extracted Text</h2>
              {ocrConfidence !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <span className={`text-sm font-semibold ${
                    ocrConfidence >= 80 ? 'text-green-600' : 
                    ocrConfidence >= 60 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {ocrConfidence}%
                  </span>
                </div>
              )}
            </div>
            <Textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Text will appear here after OCR, or you can type/paste text directly..."
              className="min-h-[250px] text-base rounded-xl resize-none"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {ocrConfidence && ocrConfidence < 70 
                ? '⚠️ Low confidence detected. Please review and correct any errors before scoring.'
                : 'You can edit the text before scoring if needed'}
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
