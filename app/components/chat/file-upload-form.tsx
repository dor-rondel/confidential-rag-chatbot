'use client';

import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';

/**
 * The file upload form component.
 * It allows users to select and upload a .txt file.
 *
 * @param {{ onUploadSuccess: () => void }} props - Props for the component.
 * @returns {JSX.Element} The file upload form component.
 */
export function FileUploadForm({
  onUploadSuccess,
}: {
  onUploadSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (file) {
      onUploadSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-lg">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Upload Your Document</h2>
          <p className="mt-2 text-neutral-500">
            Only .txt files are supported at the moment.
          </p>
        </div>
        <div className="mt-6">
          <Label htmlFor="file-upload" className="sr-only">
            File upload
          </Label>
          <Input
            id="file-upload"
            name="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".txt"
          />
        </div>
        <div className="mt-6">
          {file && (
            <Button type="submit" className="w-full">
              Start Chatting
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}
