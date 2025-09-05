'use client';

import { useState, useEffect, useActionState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { uploadFileAction, type UploadActionState } from '@/app/actions/upload';

const initialUploadState: UploadActionState = { status: 'idle' };

/**
 * The file upload form component.
 * It allows users to select and upload a .txt file.
 *
 * @param {{ onUploadSuccess: () => void }} props - Props for the component.
 *
 * @returns {JSX.Element} The file upload form component.
 */
export function FileUploadForm({
  onUploadSuccess,
}: {
  onUploadSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [state, formAction, pending] = useActionState<
    UploadActionState,
    FormData
  >(uploadFileAction, initialUploadState);

  useEffect(() => {
    if (state.status === 'success') {
      onUploadSuccess();
    }
  }, [state.status, onUploadSuccess]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    } else {
      setFile(null);
    }
  };

  return (
    <form action={formAction} encType='multipart/form-data'>
      <Card className='w-full max-w-lg'>
        <div className='text-center'>
          <h2 className='text-2xl font-semibold'>Upload Your Document</h2>
          <p className='mt-2 text-neutral-500'>
            Only .txt files are supported at the moment.
          </p>
        </div>
        <div className='mt-6'>
          <Label htmlFor='file' className='sr-only'>
            File upload
          </Label>
          <Input
            id='file'
            name='file'
            type='file'
            onChange={handleFileChange}
            accept='.txt'
            disabled={pending}
          />
        </div>
        {/* Status messages */}
        {state.status === 'error' && state.message && (
          <p className='mt-4 text-sm text-error' role='alert'>
            {state.message}
          </p>
        )}
        {state.status === 'success' && state.message && (
          <p className='mt-4 text-sm text-success' role='status'>
            {state.message}
          </p>
        )}
        <div className='mt-6'>
          {file && (
            <Button type='submit' className='w-full' disabled={pending}>
              {pending ? 'Uploading...' : 'Start Chatting'}
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}
