import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Upload, Loader2, Sparkles, ImageIcon, X, Plus, AlertCircle, User } from "lucide-react";
import { validateImageFile } from "@/lib/ocr";
import { assessWritingWithOpenAI } from "@/lib/scoring";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Assess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const addPagesInputRef = useRef<HTMLInputElement>(null);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");

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
      setImagePreviews((prev) => [...prev, ...previews]);

      toast({
        title: `${files.length} ${files.length === 1 ? 'image' : 'images'} uploaded ✓`,
        description: "Ready to assess when you're ready!",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to load images.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
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
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
      handleImageUploadForPreview(files);
    }
  };

  const handleAssessWriting = async () => {
    if (imagePreviews.length === 0) {
      toast({
        title: "No images to assess",
        description: "Please upload photos of student writing first",
        variant: "destructive",
      });
      return;
    }

    const rubric = storage.getRubric();
    if (!rubric) {
      toast({
        title: "No rubric loaded",
        description: "Please upload a rubric first in the Rubric page",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      toast({
        title: "Analyzing writing with AI...",
        description: "This may take a moment as the AI reads the handwriting and assesses against your rubric",
      });

      // Call the unified assessment API with all images
      const result = await assessWritingWithOpenAI(imagePreviews, rubric);

      // Store extracted text for display
      setExtractedText(result.extractedText);

      // Calculate total scores
      const totalScore = Object.values(result.scores).reduce((a, b) => a + b, 0);
      const averageScore = totalScore / Object.keys(result.scores).length;

      // Save assessment with student name and feedback
      const assessment = {
        id: Date.now().toString(),
        studentName: studentName.trim() || undefined,
        text: result.extractedText,
        scores: result.scores,
        feedback: result.feedback,
        justifications: result.justifications,
        timestamp: new Date().toISOString(),
        totalScore,
        averageScore,
      };

      storage.saveAssessment(assessment);

      toast({
        title: "Assessment complete! ✓",
        description: "Writing has been scored using OpenAI GPT-4o against your rubric",
      });

      // Navigate to results
      setTimeout(() => navigate(`/results/${assessment.id}`), 800);
    } catch (error) {
      console.error('Assessment error:', error);
      toast({
        title: "Assessment failed",
        description: error instanceof Error ? error.message : "There was an error assessing the writing. Please check your OpenAI API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    setImagePreviews([]);
    setPendingFiles([]);
    setExtractedText("");
    setStudentName("");
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
            <p className="text-muted-foreground">Upload Photos → AI Assesses Everything</p>
          </div>
        </div>

        {/* Upload Photos Section */}
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
                  {isDragActive ? 'Drop pages here!' : 'Upload Student\'s Writing'}
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

        {/* Review & Assess Section */}
        {imagePreviews.length > 0 && (
          <div className="space-y-6">
            {/* Student Name Input */}
            <Card className="p-6 gentle-shadow">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <Label htmlFor="studentName" className="text-lg font-semibold text-foreground">
                  Student's Name
                </Label>
              </div>
              <Input
                id="studentName"
                type="text"
                placeholder="Enter student's name (optional)"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="max-w-md rounded-xl h-12 text-base"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This will appear on the assessment report and PDF download
              </p>
            </Card>

            <Card className="p-6 gentle-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Student's Work ({imagePreviews.length} {imagePreviews.length === 1 ? 'page' : 'pages'})
                  </h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => addPagesInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Pages
                  </Button>
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                  >
                    Clear All
                  </Button>
                </div>
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
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                          : 'border-border hover:border-primary/50'
                      }`}
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
                      onClick={() => handleRemovePage(index)}
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Assess Button */}
            <Card className="p-6 gentle-shadow bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Ready to Assess?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    AI will extract handwriting, score against your rubric, and generate feedback for students, teachers, and parents
                  </p>
                </div>
                
                <Button
                  onClick={handleAssessWriting}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full max-w-md h-14 text-lg rounded-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 mr-2" />
                      Assess Writing with AI
                    </>
                  )}
                </Button>

                {isProcessing && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground"
                  >
                    This may take 10-30 seconds depending on image count...
                  </motion.p>
                )}
              </div>
            </Card>

            {/* Show extracted text if available */}
            {extractedText && (
              <Card className="p-6 gentle-shadow">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Extracted Handwriting
                </h3>
                <Textarea
                  value={extractedText}
                  readOnly
                  className="min-h-[200px] font-mono text-sm"
                />
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assess;
