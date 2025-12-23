/**
 * AvatarUpload Component
 *
 * UI-focused avatar picker responsible for:
 * - Handling avatar file selection
 * - Validating file type and size
 * - Generating a client-side preview URL
 * - Allowing the user to remove the selected image
 *
 * The parent (e.g. ProfileForm) is responsible for performing the
 * actual upload and persisting the resulting avatar URL.
 */

import { useEffect, useRef, useState } from 'react';
import { Button, Card } from '@mfe/shared-design-system';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface AvatarUploadProps {
  /** Optional initial avatar URL to display when no file is selected. */
  initialUrl?: string | null;
  /** Called whenever the selected file changes (null = clear avatar). */
  onFileChange?: (file: File | null) => void;
}

export function AvatarUpload({ initialUrl, onFileChange }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [_file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialUrl ?? null
  );
  const [error, setError] = useState<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleClickSelect = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = event.target.files?.[0] ?? null;

    if (!selected) {
      return;
    }

    // Validate file type
    if (!selected.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    // Revoke previous preview URL if it was a blob
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(selected);
    setFile(selected);
    setPreviewUrl(nextPreviewUrl);
    onFileChange?.(selected);
  };

  const handleRemove = () => {
    setError(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onFileChange?.(null);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="avatar-file-input"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-muted-foreground">No avatar</span>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleClickSelect}>
              Choose image
            </Button>
            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={handleRemove}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, or WEBP up to 5MB.
          </p>
        </div>
      </div>

      {error && (
        <Card className="p-2 border-red-200 bg-red-50">
          <p className="text-xs text-red-700">{error}</p>
        </Card>
      )}
    </div>
  );
}

export default AvatarUpload;
