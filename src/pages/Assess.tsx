import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Upload, Loader2, Sparkles, ImageIcon, Scissors, AlertCircle, Type, X, Plus } from "lucide-react";
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
  const addPagesInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>({ status: "", progress: 0 });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showCropModal, setShowCropModal] = useState(false);
  const [currentImageToCrop, setCurrentImageToCrop] = useState<{ src: string; file: File; index: number } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [isProcessingAllPages, setIsProcessingAllPages] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: true,
    noClick: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setPendingFiles((prev) => [...prev, ...acceptedFiles]);
        handleImageUploadForPreview(acceptedFiles);
      }
    }
  });

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
      setImagePreviews((prev) => [...prev, ...previews]);

      toast({
        title: `${files.length} ${files.length === 1 ? 'image' : 'images'} loaded ✓`,
        description: files.length > 1 ? "Multi-page story ready. Select which page to extract." : "Ready to crop and extract text.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to load images.",
        variant: "destructive",
      });
    }
  };

  const handleTryOCR = (pageIndex: number) => {
    if (imagePreviews.length === 0) {
      toast({
        title: "No images loaded",
        description: "Please upload images first.",
        variant: "destructive",
      });
      return;
    }

    setCurrentImageToCrop({ 
      src: imagePreviews[pageIndex],
      file: pendingFiles[pageIndex],
      index: pageIndex
    });
    setShowCropModal(true);
  };

  const handleExtractAllPages = async () => {
    if (imagePreviews.length === 0) return;
    
    setIsProcessingAllPages(true);
    let combinedText = "";
    
    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        setOcrProgress({ 
          status: `Processing page ${i + 1} of ${pendingFiles.length}...`, 
          progress: i / pendingFiles.length 
        });
        
        const result = await extractTextFromImage(pendingFiles[i], setOcrProgress);
        
        if (result.text.trim()) {
          combinedText += `\n\n--- Page ${i + 1} ---\n\n${result.text}`;
        }
      }
      
      if (combinedText.trim()) {
        setText(combinedText.trim());
        storage.saveLastOcrText(combinedText.trim());
        
        toast({
          title: `All ${pendingFiles.length} pages extracted! ✓`,
          description: "Combined text ready. Review before scoring.",
        });
      } else {
        throw new Error("No text detected in any pages.");
      }
    } catch (error: any) {
      toast({
        title: "Multi-page extraction failed",
        description: error.message || "Please try cropping individual pages.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAllPages(false);
      setOcrProgress({ status: "", progress: 0 });
    }
  };

  const handleRemovePage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    if (selectedPageIndex >= index && selectedPageIndex > 0) {
      setSelectedPageIndex(selectedPageIndex - 1);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder both arrays
    const newPreviews = [...imagePreviews];
    const newFiles = [...pendingFiles];
    
    const draggedPreview = newPreviews[draggedIndex];
    const draggedFile = newFiles[draggedIndex];
    
    newPreviews.splice(draggedIndex, 1);
    newFiles.splice(draggedIndex, 1);
    
    newPreviews.splice(dropIndex, 0, draggedPreview);
    newFiles.splice(dropIndex, 0, draggedFile);
    
    setImagePreviews(newPreviews);
    setPendingFiles(newFiles);
    
    // Adjust selected page index if needed
    if (selectedPageIndex === draggedIndex) {
      setSelectedPageIndex(dropIndex);
    } else if (draggedIndex < selectedPageIndex && dropIndex >= selectedPageIndex) {
      setSelectedPageIndex(selectedPageIndex - 1);
    } else if (draggedIndex > selectedPageIndex && dropIndex <= selectedPageIndex) {
      setSelectedPageIndex(selectedPageIndex + 1);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
      setPendingFiles((prev) => [...prev, ...files]);
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
    setSelectedPageIndex(0);
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
            <div 
              {...getRootProps()} 
              className={`text-center space-y-6 rounded-2xl border-2 border-dashed transition-colors p-8 ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {isDragActive ? 'Drop pages here!' : 'Take Photos of Student\'s Writing'}
                </h2>
                <p className="text-muted-foreground">
                  Drag & drop multiple pages, or use the buttons below
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
                    <li>Upload multiple pages for longer stories</li>
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
                  multiple
                  className="hidden"
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  multiple
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Student's Work ({imagePreviews.length} {imagePreviews.length === 1 ? 'page' : 'pages'})
                  </h2>
                </div>
                <Button
                  onClick={() => addPagesInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Pages
                </Button>
              </div>
              
              {imagePreviews.length > 1 && (
                <p className="text-xs text-muted-foreground mb-4">
                  💡 Drag pages to reorder them
                </p>
              )}
              
              <input
                ref={addPagesInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
              
              <div className="grid grid-cols-2 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div 
                    key={index} 
                    className="relative group"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div 
                      className={`rounded-xl overflow-hidden border-2 cursor-move transition-all ${
                        draggedIndex === index 
                          ? 'opacity-50 scale-95' 
                          : dragOverIndex === index 
                          ? 'border-primary ring-2 ring-primary/40 scale-105' 
                          : selectedPageIndex === index 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPageIndex(index)}
                    >
                      <img 
                        src={preview} 
                        alt={`Page ${index + 1}`} 
                        className="w-full h-auto object-contain pointer-events-none" 
                      />
                      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-lg pointer-events-none">
                        Page {index + 1}
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePage(index);
                      }}
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleClearAll}
                variant="outline"
                className="w-full mt-4 rounded-xl"
              >
                Clear All Pages
              </Button>
            </Card>

            <Card className="p-6 gentle-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Extract Text</h2>
              </div>
              
              <p className="text-muted-foreground mb-4">
                {imagePreviews.length > 1 
                  ? "Extract text from one page or all pages at once."
                  : "Crop the image to select only the handwritten text area."}
              </p>

              <Alert className="mb-6 bg-primary/5 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>First time?</strong> The AI model will download once (~150MB). After that, it works instantly offline!
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {imagePreviews.length > 1 && (
                  <Button
                    onClick={handleExtractAllPages}
                    disabled={isProcessing || isProcessingAllPages}
                    size="lg"
                    className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-primary to-secondary"
                  >
                    {isProcessingAllPages ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        Processing All Pages...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 mr-2" />
                        Extract All {imagePreviews.length} Pages
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={() => handleTryOCR(selectedPageIndex)}
                  disabled={isProcessing || isProcessingAllPages}
                  variant={imagePreviews.length > 1 ? "outline" : "default"}
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
                      {imagePreviews.length > 1 
                        ? `Crop & Extract Page ${selectedPageIndex + 1}`
                        : 'Crop & Extract Text'}
                    </>
                  )}
                </Button>
              </div>

              {(isProcessing || isProcessingAllPages) && (
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
