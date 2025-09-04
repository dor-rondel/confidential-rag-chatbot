'use client';

import { useState } from 'react';
import { FileUploadForm } from '@/app/components/chat/file-upload-form';
import { ChatInterface } from '@/app/components/chat/chat-interface';

export default function Page() {
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const handleUploadSuccess = () => {
    setIsFileUploaded(true);
  };

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-24 bg-neutral-50'>
      {isFileUploaded ? (
        <ChatInterface />
      ) : (
        <FileUploadForm onUploadSuccess={handleUploadSuccess} />
      )}
    </main>
  );
}
