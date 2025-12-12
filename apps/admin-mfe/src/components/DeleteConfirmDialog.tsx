/**
 * Delete Confirmation Dialog Component
 *
 * Reusable confirmation dialog for delete operations
 */

import { Button } from '@mfe/shared-design-system';

/**
 * Props for DeleteConfirmDialog
 */
export interface DeleteConfirmDialogProps {
  /**
   * Dialog title
   */
  title: string;

  /**
   * Confirmation message
   */
  message: string;

  /**
   * Called when cancel button is clicked
   */
  onCancel: () => void;

  /**
   * Called when confirm button is clicked
   */
  onConfirm: () => void;
}

/**
 * Delete Confirmation Dialog Component
 */
export function DeleteConfirmDialog({
  title,
  message,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-red-600">{title}</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-slate-700">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
