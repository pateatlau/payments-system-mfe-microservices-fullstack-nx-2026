/**
 * AvatarUpload Component Tests
 */

import type React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { AvatarUpload } from './AvatarUpload';

function createFile(name: string, type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], name, { type });
}

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('AvatarUpload', () => {
  it('renders initial avatar when initialUrl is provided', () => {
    render(<AvatarUpload initialUrl="https://example.com/avatar.png" />);

    expect(screen.getByAltText(/avatar preview/i)).toBeInTheDocument();
  });

  it('calls onFileChange with file when a valid image is selected', () => {
    const handleChange = jest.fn();
    render(<AvatarUpload onFileChange={handleChange} />);

    const input = screen.getByLabelText('avatar-file-input');
    const file = createFile('avatar.png', 'image/png', 1024);

    fireEvent.change(input, { target: { files: [file] } });

    expect(handleChange).toHaveBeenCalledWith(file);
    expect(screen.getByAltText(/avatar preview/i)).toBeInTheDocument();
  });

  it('shows error when non-image file is selected', () => {
    const handleChange = jest.fn();
    render(<AvatarUpload onFileChange={handleChange} />);

    const input = screen.getByLabelText('avatar-file-input');
    const file = createFile('document.pdf', 'application/pdf', 1024);

    fireEvent.change(input, { target: { files: [file] } });

    expect(handleChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/please select a valid image file/i)
    ).toBeInTheDocument();
  });

  it('shows error when file exceeds max size', () => {
    const handleChange = jest.fn();
    render(<AvatarUpload onFileChange={handleChange} />);

    const input = screen.getByLabelText('avatar-file-input');
    const tooLarge = createFile('large.png', 'image/png', 6 * 1024 * 1024);

    fireEvent.change(input, { target: { files: [tooLarge] } });

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByText(/smaller than 5mb/i)).toBeInTheDocument();
  });

  it('clears preview and notifies parent when removed', () => {
    const handleChange = jest.fn();
    render(<AvatarUpload onFileChange={handleChange} />);

    const input = screen.getByLabelText('avatar-file-input');
    const file = createFile('avatar.png', 'image/png', 1024);

    fireEvent.change(input, { target: { files: [file] } });

    expect(handleChange).toHaveBeenLastCalledWith(file);

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(handleChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(/no avatar/i)).toBeInTheDocument();
  });
});
