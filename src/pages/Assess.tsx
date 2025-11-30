import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Upload, Loader2, Sparkles, ImageIcon, Scissors, AlertCircle, Type } from "lucide-react";
import { extractTextFromImage, validateImageFile, OcrProgress } from "@/lib/ocr";
import { scoreWriting } from "@/lib/scoring";
import { generateFeedback } from "@/lib/feedback";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageCropModal } from "@/components/ImageCropModal";

const Assess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>({ status: "", progress: 0 });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showCropModal, setShowCropModal] = useState(false);
  const [currentImageToCrop, setCurrentImageToCrop] = useState<{ src: string; file: File } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleImageUploadForPreview = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      // Validate all files first
      files.forEach(validateImageFile);

      // Show all previews as reference images
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

      toast({
        title: "Images loaded ✓",
        description: "Reference images displayed. Type the text or try OCR with cropping.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to load images.",
        variant: "destructive",
      });
    }
  };

  const handleTryOCR = () => {
    if (imagePreviews.length === 0) {
      toast({
        title: "No images loaded",
        description: "Please upload images first.",
        variant: "destructive",
      });
      return;
    }

    // For simplicity, use first image for cropping
    // In production, you might want to let user choose which image to OCR
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentImageToCrop({ 
        src: imagePreviews[0],
        file: pendingFiles[0]
      });
      setShowCropModal(true);
    };
    
    if (pendingFiles[0]) {
      reader.readAsDataURL(pendingFiles[0]);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropModal(false);
    setIsProcessing(true);

    try {
      // Convert blob to file
      const croppedFile = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
      
      setOcrProgress({ status: "Processing cropped image...", progress: 0 });
      const result = await extractTextFromImage(croppedFile, setOcrProgress);
      
      if (result.text.trim()) {
        setText(result.text);
        storage.saveLastOcrText(result.text);

        toast({
          title: `Text extracted! ✓`,
          description: `Confidence: ${result.confidence}%. ${result.confidence < 70 ? 'OCR works best for printed text. Please review carefully.' : 'Review and edit as needed.'}`,
        });
      } else {
        throw new Error("No text detected. OCR works best for printed text.");
      }
    } catch (error: any) {
      toast({
        title: "OCR failed",
        description: error.message || "OCR is designed for printed text. Consider typing the text manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress({ status: "", progress: 0 });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setPendingFiles(files);
      handleImageUploadForPreview(files);
    }
  };

  const handleScoreWriting = () => {
    if (!text.trim()) {
      toast({
        title: "No text to score",
        description: "Please enter or extract text first.",
        variant: "destructive",
      });
      return;
    }

    // Score the writing
    const scores = scoreWriting(text);

    // Generate all feedback modes
    const feedback = {
      simple: generateFeedback(scores, text, 'simple'),
      report: generateFeedback(scores, text, 'report'),
      advanced: generateFeedback(scores, text, 'advanced'),
    };

    // Save assessment
    const assessment = {
      id: Date.now().toString(),
      text: text,
      scores,
      feedback,
      timestamp: new Date().toISOString(),
    };

    storage.saveAssessment(assessment);

    // Navigate to results
    navigate(`/results/${assessment.id}`);
  };

  const handleClearAll = () => {
    setText("");
    setImagePreviews([]);
    setPendingFiles([]);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
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
            <p className="text-muted-foreground">Type the student's writing or upload a photo</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* PRIMARY: Manual Text Entry */}
          <Card className="p-6 gentle-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Enter Writing Sample</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Type or paste the student's writing directly (most reliable method)
            </p>
            
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste the student's writing here..."
              className="min-h-[350px] text-base rounded-xl resize-none"
              disabled={isProcessing}
            />
            
            {text.trim() && (
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  className="rounded-xl"
                >
                  Clear All
                </Button>
              </div>
            )}
          </Card>

          {/* SECONDARY: Image Reference + OCR Option */}
          <div className="space-y-4">
            <Card className="p-6 gentle-shadow">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Reference Images</h2>
              </div>
              
              <Alert className="mb-4 bg-muted/30 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  Upload images as a reference while typing. OCR is available but works best for <strong>printed text only</strong>.
                </AlertDescription>
              </Alert>

              {imagePreviews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 space-y-2 max-h-[300px] overflow-y-auto"
                >
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="rounded-xl overflow-hidden border-2 border-border">
                      <img src={preview} alt={`Reference ${index + 1}`} className="w-full h-auto object-contain" />
                    </div>
                  ))}
                </motion.div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full h-12 border-2 rounded-xl"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Take Photo
                </Button>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full h-12 border-2 rounded-xl"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Images
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
              </div>
            </Card>

            {/* OCR Option */}
            {imagePreviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6 gentle-shadow bg-muted/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Scissors className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Try OCR (Experimental)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    OCR works best for <strong>printed text</strong>. For handwritten samples, manual typing is strongly recommended.
                  </p>
                  <Button
                    onClick={handleTryOCR}
                    disabled={isProcessing}
                    variant="secondary"
                    className="w-full h-12 rounded-xl"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-5 h-5 mr-2" />
                        Crop & Run OCR
                      </>
                    )}
                  </Button>
                  
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 space-y-2"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{ocrProgress.status}</span>
                      </div>
                      <Progress value={ocrProgress.progress * 100} className="h-2" />
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Score Button */}
        {text.trim() && !isProcessing && (
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

      <AnimatePresence>
        {showCropModal && currentImageToCrop && (
          <ImageCropModal
            open={showCropModal}
            onClose={() => setShowCropModal(false)}
            imageSrc={currentImageToCrop.src}
            onCropComplete={handleCropComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Assess;
