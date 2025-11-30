// OCR processing using Tesseract.js with image preprocessing

import Tesseract from 'tesseract.js';

export interface OcrProgress {
  status: string;
  progress: number;
}

export interface OcrResult {
  text: string;
  confidence: number;
}

// Load image file into an HTMLImageElement
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

// Comprehensive image preprocessing for better OCR
async function preprocessImage(imageFile: File): Promise<Blob> {
  const img = await loadImage(imageFile);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  
  // Set canvas size to image size
  canvas.width = img.width;
  canvas.height = img.height;
  
  // Draw original image
  ctx.drawImage(img, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Step 1: Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  
  // Step 2: Increase contrast using histogram stretching
  let min = 255, max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i];
    if (val < min) min = val;
    if (val > max) max = val;
  }
  
  const range = max - min;
  if (range > 0) {
    for (let i = 0; i < data.length; i += 4) {
      const normalized = ((data[i] - min) / range) * 255;
      data[i] = data[i + 1] = data[i + 2] = normalized;
    }
  }
  
  // Step 3: Apply Otsu's method for adaptive thresholding
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }
  
  const total = canvas.width * canvas.height;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }
  
  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 0;
  
  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;
    
    wF = total - wB;
    if (wF === 0) break;
    
    sumB += i * histogram[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);
    
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }
  
  // Apply threshold - convert to pure black and white
  for (let i = 0; i < data.length; i += 4) {
    const binary = data[i] > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = binary;
  }
  
  // Put processed image back
  ctx.putImageData(imageData, 0, 0);
  
  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create processed image'));
    }, 'image/png');
  });
}

export async function extractTextFromImage(
  imageFile: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  try {
    // Preprocess image for better OCR
    if (onProgress) {
      onProgress({ status: 'Preprocessing image...', progress: 0 });
    }
    
    const processedImage = await preprocessImage(imageFile);
    
    // Configure Tesseract for handwritten text
    const result = await Tesseract.recognize(processedImage, 'eng', {
      tessedit_pageseg_mode: '6', // Assume single uniform block of text
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?\'"-:;() \n\t',
      preserve_interword_spaces: '1',
      logger: (m: any) => {
        if (onProgress) {
          onProgress({
            status: m.status || 'processing',
            progress: m.progress || 0
          });
        }
      }
    } as any); // Type assertion for Tesseract config

    const confidence = result.data.confidence || 0;
    
    return {
      text: result.data.text,
      confidence: Math.round(confidence)
    };
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
