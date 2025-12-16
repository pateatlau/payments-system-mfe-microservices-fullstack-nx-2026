# Avatar Implementation Strategy

**Status:** Recommended Approach  
**Version:** 1.0  
**Date:** December 12, 2025  
**Context:** Profile MFE Avatar Upload Implementation

---

## Executive Summary

This document provides the recommended approach for implementing avatar upload functionality in the Profile MFE, considering:

- Current backend capabilities (URL-based only)
- POC-3 requirements (production-ready, no throw-away code)
- Scalability and maintainability
- User experience

**Recommended Approach:** **Hybrid Strategy - URL-based with File Upload Path**

---

## Current Backend State

### Profile Service Capabilities

**Current Implementation:**

- ✅ Accepts `avatarUrl` as string (URL) via `PUT /api/profile`
- ✅ Validator: `avatarUrl: z.string().url().optional()`
- ✅ Database: `avatarUrl String?` field in `UserProfile` model
- ❌ No file upload endpoint (`POST /api/profile/avatar` not implemented)
- ❌ No file storage infrastructure

**API Endpoint:**

```typescript
PUT /api/profile
Body: {
  avatarUrl?: string;  // URL only
  phoneNumber?: string;
  address?: string;
  bio?: string;
}
```

---

## Implementation Options Analysis

### Option 1: URL-Based Only (Simplest)

**Approach:**

- User provides avatar URL (e.g., from external service, Gravatar, etc.)
- Frontend validates URL format
- Backend stores URL directly
- No file upload needed

**Pros:**

- ✅ Works immediately with current backend
- ✅ No backend changes required
- ✅ Simple implementation
- ✅ No storage costs
- ✅ Fast to implement

**Cons:**

- ❌ Poor UX (users must have image URL)
- ❌ No direct file upload
- ❌ External dependency on image hosting
- ❌ Not production-ready for most use cases

**Verdict:** ❌ **Not Recommended** - Poor user experience

---

### Option 2: Direct File Upload to Backend

**Approach:**

1. Add `POST /api/profile/avatar` endpoint
2. Use `multer` or `formidable` for file handling
3. Store files on filesystem or cloud storage
4. Return URL to frontend
5. Frontend submits URL to `PUT /api/profile`

**Pros:**

- ✅ Full control over file storage
- ✅ Good user experience
- ✅ Can implement image optimization/resizing
- ✅ No external dependencies

**Cons:**

- ❌ Requires backend changes (new endpoint)
- ❌ File storage management (cleanup, backups)
- ❌ Scalability concerns (filesystem storage)
- ❌ Security considerations (file validation, size limits)
- ❌ More complex implementation

**Verdict:** ⚠️ **Acceptable** - Requires backend work, good for POC-3

---

### Option 3: Third-Party Service (Cloudinary/AWS S3)

**Approach:**

1. Frontend uploads directly to Cloudinary/S3 (signed URL)
2. Or: Frontend uploads to backend, backend uploads to cloud
3. Cloud service returns URL
4. Frontend submits URL to `PUT /api/profile`

**Pros:**

- ✅ Production-ready
- ✅ Scalable (CDN, optimization)
- ✅ Image transformations (resize, crop, format conversion)
- ✅ No storage management
- ✅ Industry standard

**Cons:**

- ❌ External dependency
- ❌ Cost (though minimal for avatars)
- ❌ Requires API keys/configuration
- ❌ More complex setup

**Verdict:** ✅ **Best for Production** - But may be overkill for POC-3

---

### Option 4: Base64 Encoding

**Approach:**

- Convert image to base64 string
- Send as `avatarUrl` (data URI)
- Backend stores base64 string

**Pros:**

- ✅ Works with current backend (no changes)
- ✅ Simple implementation

**Cons:**

- ❌ Large payload size (33% overhead)
- ❌ Not efficient for database storage
- ❌ Poor performance
- ❌ Not production-ready

**Verdict:** ❌ **Not Recommended** - Performance issues

---

## Recommended Approach: Hybrid Strategy

### Phase 1: URL-Based with File Upload Path (POC-3)

**Implementation:**

1. **Frontend (Immediate):**
   - Implement `AvatarUpload` component with file selection
   - Client-side image preview (using `URL.createObjectURL`)
   - File validation (type, size)
   - **For POC-3:** User can either:
     - Provide URL directly (input field)
     - Select file (preview only, URL submission disabled until backend ready)
   - Or: Implement client-side image upload to temporary storage (see below)

2. **Backend (Future Enhancement):**
   - Add `POST /api/profile/avatar` endpoint
   - Implement file upload handling
   - Store files (filesystem or cloud storage)
   - Return URL to frontend

3. **Integration:**
   - Frontend uploads file → Backend returns URL → Frontend submits URL to `PUT /api/profile`

**Why This Approach:**

- ✅ Works with current backend (URL-based)
- ✅ Frontend can be fully implemented now
- ✅ Backend enhancement can be added later
- ✅ No throw-away code (frontend component is reusable)
- ✅ Good user experience (file selection + preview)
- ✅ Production-ready path forward

---

### Phase 2: Direct File Upload (Recommended for POC-3)

**If we want full functionality in POC-3:**

1. **Backend Changes:**

   ```typescript
   // Add new endpoint
   POST /api/profile/avatar
   Content-Type: multipart/form-data
   Body: { file: File }

   Response: {
     success: true,
     data: {
       avatarUrl: "https://localhost/api/profile/avatars/{userId}/{filename}"
     }
   }
   ```

2. **Implementation Details:**
   - Use `multer` for file handling
   - Store in `uploads/avatars/{userId}/` directory
   - Validate: image type, max 5MB, dimensions
   - Generate unique filename
   - Return public URL
   - Cleanup old avatars on update

3. **Frontend:**
   - Upload file to `POST /api/profile/avatar`
   - Get URL from response
   - Submit URL to `PUT /api/profile`

---

## Detailed Implementation Plan

### Option A: URL-Based with File Preview (Immediate, No Backend Changes)

**Frontend Implementation:**

```typescript
// AvatarUpload.tsx
interface AvatarUploadProps {
  value?: string; // Current avatar URL
  onChange: (url: string) => void;
}

export function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);

    // For POC-3: Show message that file upload will be available soon
    // For now, user must provide URL
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setPreview(urlInput.trim());
    }
  };

  return (
    <div>
      {/* Current avatar or preview */}
      {preview && <img src={preview} alt="Avatar preview" />}

      {/* File selection (preview only for now) */}
      <input type="file" accept="image/*" onChange={handleFileSelect} />
      {file && (
        <Alert>
          File selected. Direct upload coming soon. Please provide URL below.
        </Alert>
      )}

      {/* URL input */}
      <Input
        type="url"
        placeholder="Or enter image URL"
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
      />
      <Button onClick={handleUrlSubmit}>Use URL</Button>
    </div>
  );
}
```

**Pros:**

- ✅ Works immediately
- ✅ No backend changes
- ✅ Component is reusable when backend is ready
- ✅ Good UX (preview works)

**Cons:**

- ⚠️ Users must provide URL (not ideal UX)

---

### Option B: Direct File Upload (Recommended for POC-3)

**Backend Implementation:**

```typescript
// apps/profile-service/src/controllers/profile.controller.ts

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer
const upload = multer({
  dest: 'uploads/avatars/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * Upload avatar image
 */
export async function uploadAvatar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
      return;
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${userId}-${Date.now()}${ext}`;
    const userDir = path.join('uploads/avatars', userId);
    const filepath = path.join(userDir, filename);

    // Ensure user directory exists
    await fs.mkdir(userDir, { recursive: true });

    // Move file to user directory
    await fs.rename(file.path, filepath);

    // Delete old avatar if exists
    const profile = await profileService.getOrCreateProfile(userId);
    if (profile.avatarUrl) {
      const oldPath = profile.avatarUrl.replace(
        `${config.apiGatewayUrl}/api/profile/avatars/`,
        'uploads/avatars/'
      );
      try {
        await fs.unlink(oldPath);
      } catch (error) {
        // Ignore if file doesn't exist
      }
    }

    // Generate public URL
    const avatarUrl = `${config.apiGatewayUrl}/api/profile/avatars/${userId}/${filename}`;

    res.json({
      success: true,
      data: { avatarUrl },
    });
  } catch (error) {
    logger.error('Error uploading avatar', { error });
    next(error);
  }
}

// Add route
router.post('/avatar', authenticate, upload.single('file'), uploadAvatar);
```

**Frontend Implementation:**

```typescript
// AvatarUpload.tsx
export function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        onChange(result.data.avatarUrl);
        setPreview(result.data.avatarUrl);
      } else {
        alert('Upload failed: ' + result.error?.message);
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {preview && <img src={preview} alt="Avatar" />}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {uploading && <Loading />}
    </div>
  );
}
```

---

## Recommendation for POC-3

### Recommended: **Option B - Direct File Upload**

**Rationale:**

1. ✅ **Production-ready** - Proper file handling, validation, storage
2. ✅ **Good UX** - Users can upload directly
3. ✅ **No throw-away code** - Implementation is production-quality
4. ✅ **Scalable path** - Can migrate to cloud storage later
5. ✅ **Complete feature** - Matches implementation plan requirements

**Implementation Steps:**

1. Add `multer` dependency to Profile Service
2. Create `POST /api/profile/avatar` endpoint
3. Implement file storage (filesystem for POC-3, cloud for production)
4. Add static file serving for avatars
5. Implement frontend `AvatarUpload` component
6. Add cleanup logic for old avatars

**Future Enhancement (Production):**

- Migrate to AWS S3 or Cloudinary
- Add image optimization (resize, compress)
- Add CDN for avatar delivery
- Implement image transformations

---

## File Storage Strategy

### POC-3: Filesystem Storage

**Structure:**

```
uploads/
  avatars/
    {userId}/
      {timestamp}-{filename}.{ext}
```

**Pros:**

- ✅ Simple implementation
- ✅ No external dependencies
- ✅ Good for POC-3

**Cons:**

- ⚠️ Not scalable (single server)
- ⚠️ Backup/restore complexity
- ⚠️ Not suitable for production at scale

### Production: Cloud Storage (AWS S3 / Cloudinary)

**Structure:**

- S3: `s3://bucket/avatars/{userId}/{filename}`
- Cloudinary: Auto-managed

**Pros:**

- ✅ Scalable
- ✅ CDN delivery
- ✅ Image optimization
- ✅ Backup/redundancy

**Cons:**

- ❌ External dependency
- ❌ Cost (minimal for avatars)

---

## Security Considerations

1. **File Validation:**
   - ✅ File type (images only)
   - ✅ File size (max 5MB)
   - ✅ File content validation (magic numbers)
   - ✅ Filename sanitization

2. **Access Control:**
   - ✅ Authenticated users only
   - ✅ Users can only upload their own avatar
   - ✅ Private file storage (not public directory)

3. **Storage Security:**
   - ✅ Unique filenames (prevent overwrites)
   - ✅ User-specific directories
   - ✅ Cleanup old files

---

## Testing Strategy

1. **Unit Tests:**
   - File validation
   - File size limits
   - File type validation
   - URL generation

2. **Integration Tests:**
   - Upload flow
   - File storage
   - URL retrieval
   - Old file cleanup

3. **E2E Tests:**
   - User uploads avatar
   - Avatar displays correctly
   - Avatar updates work

---

## Migration Path

**POC-3 → Production:**

1. Implement filesystem storage (POC-3)
2. Add cloud storage adapter interface
3. Migrate to S3/Cloudinary (Production)
4. Keep filesystem as fallback

---

## Conclusion

**Recommended Approach:** **Direct File Upload (Option B)**

- Production-ready implementation
- Good user experience
- No throw-away code
- Scalable path forward
- Meets POC-3 requirements

**Implementation Priority:**

1. Backend: Add `POST /api/profile/avatar` endpoint
2. Frontend: Implement `AvatarUpload` component
3. Integration: Connect upload → profile update flow
4. Testing: Comprehensive test coverage

---

**End of Strategy Document**
