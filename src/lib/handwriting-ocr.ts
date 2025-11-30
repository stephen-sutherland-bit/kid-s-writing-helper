// Handwriting OCR using Lovable AI with Gemini Vision

export interface OcrProgress {
  status: string;
  progress: number;
}

export interface OcrResult {
  text: string;
  confidence: number;
}

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract text from image using AI-powered OCR
 * Uses Lovable AI with Gemini Vision for accurate handwriting recognition
 */
export async function extractTextFromImage(
  imageFile: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  try {
    if (onProgress) {
      onProgress({ status: 'Preparing image...', progress: 10 });
    }

    // Convert image to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    if (onProgress) {
      onProgress({ status: 'Analyzing handwriting with AI...', progress: 30 });
    }

    // Call edge function for AI extraction
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-handwriting`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageBase64 }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add credits to continue.');
      }
      
      throw new Error(error.error || 'Failed to extract text from image');
    }

    const result = await response.json();
    
    if (onProgress) {
      onProgress({ status: 'Text extracted successfully!', progress: 100 });
    }

    return {
      text: result.text,
      confidence: result.confidence || 95
    };
  } catch (error) {
    console.error('OCR Error:', error);
    if (error instanceof Error) {
      throw error;
    }
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
