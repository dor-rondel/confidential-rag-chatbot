import { expect, vi, describe, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploadForm } from './file-upload-form';

// Hoisted mock for the server action to force a success transition
vi.mock('@/app/actions/upload', () => ({
  uploadFileAction: vi.fn(async () => ({
    status: 'success',
    message: 'File ingested successfully.',
  })),
}));

describe('<FileUploadForm />', () => {
  it('should render the form', () => {
    render(<FileUploadForm onUploadSuccess={() => {}} />);
    expect(screen.getByText('Upload Your Document')).toBeInTheDocument();
    expect(screen.getByLabelText('File upload')).toBeInTheDocument();
  });

  it('should enable submit button only when a file is selected', async () => {
    const onUploadSuccess = vi.fn();
    render(<FileUploadForm onUploadSuccess={onUploadSuccess} />);

    const submitButton = screen.queryByRole('button', {
      name: /start chatting/i,
    });
    expect(submitButton).not.toBeInTheDocument();

    const fileInput = screen.getByLabelText('File upload');
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await userEvent.upload(fileInput, file);

    const enabledSubmitButton = screen.getByRole('button', {
      name: /start chatting/i,
    });
    expect(enabledSubmitButton).toBeInTheDocument();
  });

  it('should call onUploadSuccess on submit', async () => {
    const onUploadSuccess = vi.fn();
    render(<FileUploadForm onUploadSuccess={onUploadSuccess} />);

    const fileInput = screen.getByLabelText('File upload');
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await userEvent.upload(fileInput, file);

    const submitButton = screen.getByRole('button', {
      name: /start chatting/i,
    });
    await userEvent.click(submitButton);

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalledTimes(1));
  });
});
