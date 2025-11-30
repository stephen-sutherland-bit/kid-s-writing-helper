import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Upload, Camera, FileText } from "lucide-react";
import { storage } from "@/lib/storage";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const hasRubric = storage.hasRubric();
  const rubric = storage.getRubric();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <BookOpen className="w-16 h-16 mx-auto text-primary" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Elle's Personal Assistant
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            A warm, friendly tool to help assess student writing with the e-asTTle rubric
          </p>
        </div>

        {/* Main Actions */}
        <Card className="p-8 gentle-shadow border-2 border-border">
          <div className="space-y-6">
            {/* Rubric Status */}
            <div className="bg-muted/30 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Rubric Status</h3>
              </div>
              {hasRubric && rubric ? (
                <div className="text-sm space-y-1">
                  <p className="text-foreground">
                    ✓ Rubric loaded with {rubric.categories.length} categories
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Last updated: {new Date(rubric.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Using default e-asTTle rubric. You can upload your own rubric anytime.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                onClick={() => navigate("/assess")}
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gentle-shadow"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start New Assessment
              </Button>

              <Button
                onClick={() => navigate("/rubric")}
                variant="outline"
                className="w-full h-12 text-base border-2 rounded-xl"
              >
                <Upload className="w-5 h-5 mr-2" />
                {hasRubric ? "Update Rubric" : "Upload Custom Rubric"}
              </Button>
            </div>

            {/* Quick Info */}
            <div className="pt-4 border-t border-border space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                Take or upload a photo of student writing
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                Automatic scoring across all rubric areas
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                Get feedback in kid-friendly, teacher, or academic style
              </p>
            </div>
          </div>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground">
          All processing happens in your browser. No data is sent to any server.
        </p>
      </motion.div>
    </div>
  );
};

export default Home;
