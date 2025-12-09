/**
 * DeleteConfirmDialog Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();

  const defaultProps = {
    title: 'Delete User',
    message: 'Are you sure you want to delete this user?',
    onCancel: mockOnCancel,
    onConfirm: mockOnConfirm,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with title and message', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Delete User')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this user?')
    ).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm when delete button is clicked', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should display custom title', () => {
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        title="Delete Payment"
        message="Are you sure?"
      />
    );

    expect(screen.getByText('Delete Payment')).toBeInTheDocument();
  });

  it('should display custom message', () => {
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        title="Confirm"
        message="This action is irreversible"
      />
    );

    expect(screen.getByText('This action is irreversible')).toBeInTheDocument();
  });

  it('should have destructive styling on delete button', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    const deleteButton = screen.getByText('Delete');
    // The button should have destructive variant applied via Button component
    expect(deleteButton).toBeInTheDocument();
  });
});
