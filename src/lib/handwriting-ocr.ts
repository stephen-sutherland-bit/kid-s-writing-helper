// Handwriting OCR using Hugging Face TrOCR model
import { pipeline, Pipeline } from '@huggingface/transformers';

export interface OcrProgress {
  status: string;
  progress: number;
}

export interface OcrResult {
  text: string;
  confidence: number;
}

let ocrPipeline: Pipeline | null = null;
let isLoading = false;
let loadingPromise: Promise<Pipeline> | null = null;

/**
 * Initialize the TrOCR pipeline for handwriting recognition
 * The model is downloaded once (~150MB) and cached locally
 */
async function initializePipeline(
  onProgress?: (progress: OcrProgress) => void
): Promise<Pipeline> {
  // If already initialized, return it
  if (ocrPipeline) {
    return ocrPipeline;
  }

  // If currently loading, wait for that to complete
  if (isLoading && loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  isLoading = true;
  loadingPromise = (async () => {
    try {
      if (onProgress) {
        onProgress({ status: 'Downloading AI model (one-time, ~150MB)...', progress: 0 });
      }

      const pipe = await pipeline(
        'image-to-text',
        'Xenova/trocr-base-handwritten',
        {
          progress_callback: (data: any) => {
            if (onProgress && data.progress !== undefined) {
              const progressPercent = Math.round(data.progress);
              onProgress({
                status: data.status === 'progress' 
                  ? `Downloading AI model... ${progressPercent}%`
                  : data.status || 'Loading...',
                progress: data.progress || 0
              });
            }
          }
        }
      );

      ocrPipeline = pipe;
      isLoading = false;
      
      if (onProgress) {
        onProgress({ status: 'Model ready!', progress: 100 });
      }

      return pipe;
    } catch (error) {
      isLoading = false;
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Extract text from image using TrOCR (trained on handwriting)
 */
export async function extractTextFromImage(
  imageFile: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  try {
    // Initialize the pipeline (or use cached one)
    const pipe = await initializePipeline(onProgress);

    if (onProgress) {
      onProgress({ status: 'Extracting text from handwriting...', progress: 90 });
    }

    // Convert file to blob for processing
    const imageBlob = new Blob([imageFile], { type: imageFile.type });

    // Extract text
    const result = await pipe(imageBlob) as any;
    
    if (onProgress) {
      onProgress({ status: 'Complete!', progress: 100 });
    }

    // TrOCR returns array with generated_text
    const text = result?.[0]?.generated_text || '';
    
    return {
      text,
      confidence: 85 // TrOCR doesn't provide confidence scores, so we use a default high value
    };
  } catch (error) {
    console.error('TrOCR Error:', error);
    throw new Error('Failed to extract text from handwriting. Please try again or ensure the image is clear.');
  }
}

export function validateImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPEG, PNG, or WebP)');
  }

  if (file.size > maxSize) {
    throw new Error('Image file is too large. Please use an image under 10MB.');
  }

  return true;
}

/**
 * Check if the model is already cached locally
 */
export function isModelCached(): boolean {
  // This is a simple check - in reality, the transformers library handles caching
  return ocrPipeline !== null;
}
