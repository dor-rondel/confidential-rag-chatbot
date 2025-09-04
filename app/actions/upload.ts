'use server';

import { ingestDocument } from '@/app/lib/langchain/ingestion';

export type UploadActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['text/plain'];
const ALLOWED_EXTENSION = '.txt';

function validateExtension(filename: string) {
  return filename.toLowerCase().endsWith(ALLOWED_EXTENSION);
}

export async function uploadFileAction(
  _prevState: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return { status: 'error', message: 'No file provided.' };
  }

  if (!validateExtension(file.name)) {
    return { status: 'error', message: 'Only .txt files are allowed.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== '') {
    // Some browsers may send an empty string for plain text; allow that.
    return { status: 'error', message: 'Invalid file type.' };
  }

  if (file.size === 0) {
    return { status: 'error', message: 'File is empty.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      status: 'error',
      message: `File too large. Max ${(
        MAX_FILE_SIZE_BYTES /
        1024 /
        1024
      ).toFixed(1)}MB.`,
    };
  }

  try {
    await ingestDocument(file);
    return { status: 'success', message: 'File ingested successfully.' };
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return { status: 'error', message: `Ingestion failed: ${errorMessage}` };
  }
}
