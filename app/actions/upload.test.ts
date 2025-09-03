import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mocks
const ingestionState = vi.hoisted(() => ({ ingestDocument: vi.fn() }));

vi.mock('@/app/lib/langchain/ingestion', () => ({
  ingestDocument: (...args: unknown[]) => ingestionState.ingestDocument(...args),
}));

import { uploadFileAction, type UploadActionState } from './upload';

function createTxtFile(name: string, content: string, type = 'text/plain'): File {
  return new File([content], name, { type });
}

async function run(formData: FormData, prev: UploadActionState = { status: 'idle' }) {
  return uploadFileAction(prev, formData);
}

describe('uploadFileAction', () => {
  beforeEach(() => {
    ingestionState.ingestDocument.mockReset();
  });

  it('returns error when no file provided', async () => {
    const fd = new FormData();
    const res = await run(fd);
    expect(res).toStrictEqual({ status: 'error', message: 'No file provided.' });
  });

  it('returns error when field is not a File instance', async () => {
    const fd = new FormData();
    fd.set('file', 'not-a-file');
    const res = await run(fd);
    expect(res).toStrictEqual({ status: 'error', message: 'No file provided.' });
  });

  it('rejects non .txt extension', async () => {
    const fd = new FormData();
    fd.set('file', createTxtFile('readme.md', 'content'));
    const res = await run(fd);
    expect(res).toStrictEqual({ status: 'error', message: 'Only .txt files are allowed.' });
  });

  it('rejects invalid mime type even with .txt extension', async () => {
    const fd = new FormData();
    fd.set('file', createTxtFile('file.txt', 'data', 'application/pdf'));
    const res = await run(fd);
    expect(res).toStrictEqual({ status: 'error', message: 'Invalid file type.' });
  });

  it('rejects empty file', async () => {
    const fd = new FormData();
    fd.set('file', createTxtFile('empty.txt', ''));
    const res = await run(fd);
    expect(res).toStrictEqual({ status: 'error', message: 'File is empty.' });
  });

  it('rejects file exceeding max size', async () => {
    // 5MB + 1 byte
    const bigContent = 'a'.repeat(5 * 1024 * 1024 + 1);
    const fd = new FormData();
    fd.set('file', createTxtFile('big.txt', bigContent));
    const res = await run(fd);
    expect(res.status).toBe('error');
    expect(res.message).toMatch(/^File too large. Max 5\.0MB\./);
  });

  it('returns success when ingestion succeeds', async () => {
    const file = createTxtFile('doc.txt', 'hello world');
    ingestionState.ingestDocument.mockResolvedValueOnce(undefined);

    const fd = new FormData();
    fd.set('file', file);

    const res = await run(fd);
    expect(ingestionState.ingestDocument).toHaveBeenCalledTimes(1);
    expect(ingestionState.ingestDocument).toHaveBeenCalledWith(file);
    expect(res).toStrictEqual({ status: 'success', message: 'File ingested successfully.' });
  });

  it('returns error when ingestion throws', async () => {
    const file = createTxtFile('doc.txt', 'hello world');
    const injected = new Error('Vector store unreachable');
    ingestionState.ingestDocument.mockRejectedValueOnce(injected);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const fd = new FormData();
    fd.set('file', file);

    const res = await run(fd);
    expect(ingestionState.ingestDocument).toHaveBeenCalledTimes(1);
    expect(res.status).toBe('error');
    expect(res.message).toBe('Ingestion failed: Vector store unreachable');
    // console.error called with the original thrown error
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});
