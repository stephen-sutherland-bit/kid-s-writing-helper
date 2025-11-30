// OCR processing using Tesseract.js

import Tesseract from 'tesseract.js';

export interface OcrProgress {
  status: string;
  progress: number;
}

export async function extractTextFromImage(
  imageFile: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  try {
    const result = await Tesseract.recognize(imageFile, 'eng', {
      logger: (m: any) => {
        if (onProgress) {
          onProgress({
            status: m.status || 'processing',
            progress: m.progress || 0
          });
        }
      }
    });

    return result.data.text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image. Please try again or use a clearer photo.');
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
