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
          description: `Handwriting recognized. Please review and edit as needed before scoring.`,
        });
      } else {
        throw new Error("No text detected. Please try a clearer photo or crop just the handwriting area.");
      }
    } catch (error: any) {
      toast({
        title: "Text extraction failed",
        description: error.message || "Please try a clearer photo or crop just the handwriting area.",
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
            <p className="text-muted-foreground">Photo → Crop → Extract → Grade</p>
          </div>
        </div>

        {/* Step 1: Upload Photo of Student Writing */}
        {imagePreviews.length === 0 && (
          <Card className="p-8 gentle-shadow">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Take a Photo of Student's Writing</h2>
                <p className="text-muted-foreground">
                  Photograph the child's handwritten work, then crop to select just the writing area
                </p>
              </div>

              <Alert className="bg-primary/5 border-primary/20 text-left">
                <AlertCircle className="h-5 w-5 text-primary" />
                <AlertDescription className="text-sm space-y-2">
                  <p className="font-semibold">Tips for best results:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Use good lighting (natural light works best)</li>
                    <li>Hold camera directly above the paper (avoid angles)</li>
                    <li>Ensure handwriting is clearly visible</li>
                    <li>Include only the child's writing in the photo</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-3 max-w-md mx-auto">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full h-14 text-lg rounded-xl"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Take Photo Now
                </Button>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  variant="outline"
                  size="lg"
                  className="w-full h-14 text-lg border-2 rounded-xl"
                >
                  <Upload className="w-6 h-6 mr-2" />
                  Upload from Gallery
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
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Crop & Extract Text */}
        {imagePreviews.length > 0 && !text.trim() && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 gentle-shadow">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Student's Work</h2>
              </div>
              
              <div className="space-y-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="rounded-xl overflow-hidden border-2 border-border">
                    <img src={preview} alt={`Student work ${index + 1}`} className="w-full h-auto object-contain" />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleClearAll}
                variant="outline"
                className="w-full mt-4 rounded-xl"
              >
                Upload Different Photo
              </Button>
            </Card>

            <Card className="p-6 gentle-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Extract Child's Writing</h2>
              </div>
              
              <p className="text-muted-foreground mb-4">
                Crop the image to select only the child's handwritten text area, then extract the text for grading.
              </p>

              <Alert className="mb-6 bg-primary/5 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>First time?</strong> The AI model will download once (~150MB). After that, it works instantly offline!
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleTryOCR}
                disabled={isProcessing}
                size="lg"
                className="w-full h-14 text-lg rounded-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  <>
                    <Scissors className="w-6 h-6 mr-2" />
                    Crop & Extract Text
                  </>
                )}
              </Button>

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{ocrProgress.status}</span>
                  </div>
                  <Progress value={ocrProgress.progress * 100} className="h-2" />
                </motion.div>
              )}
            </Card>
          </div>
        )}

        {/* Step 3: Review & Score */}
        {text.trim() && (
          <div className="space-y-6">
            <Card className="p-6 gentle-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Extracted Text</h2>
                </div>
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  Start Over
                </Button>
              </div>
              
              <Alert className="mb-4 bg-primary/5 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  Review the extracted text below. You can edit it if needed before scoring.
                </AlertDescription>
              </Alert>

              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Extracted text will appear here..."
                className="min-h-[300px] text-base rounded-xl resize-none"
                disabled={isProcessing}
              />
            </Card>
          </div>
        )}

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
