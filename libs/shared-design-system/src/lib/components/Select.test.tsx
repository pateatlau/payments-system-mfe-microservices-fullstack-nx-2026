/**
 * Select Component Tests
 *
 * Note: Radix UI Select uses portals for the dropdown content,
 * which requires special handling in tests. These tests focus on
 * the trigger and basic functionality that doesn't require portal rendering.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './Select';

// Mock ResizeObserver and PointerEvent for Radix UI
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock PointerEvent
  class MockPointerEvent extends Event {
    button: number;
    ctrlKey: boolean;
    pointerType: string;

    constructor(type: string, props: PointerEventInit = {}) {
      super(type, props);
      this.button = props.button ?? 0;
      this.ctrlKey = props.ctrlKey ?? false;
      this.pointerType = props.pointerType ?? 'mouse';
    }
  }

  global.PointerEvent =
    MockPointerEvent as unknown as typeof globalThis.PointerEvent;

  // Mock hasPointerCapture
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};

  // Mock scrollIntoView
  Element.prototype.scrollIntoView = () => {};
});

describe('Select', () => {
  it('should render the trigger successfully', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should display placeholder text', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('should display selected value', () => {
    render(
      <Select defaultValue="2">
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('should apply custom className to trigger', () => {
    render(
      <Select>
        <SelectTrigger className="custom-class">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });

  it('should have correct aria attributes on trigger', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Select option">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-label', 'Select option');
  });

  it('should render with controlled value', () => {
    render(
      <Select value="1">
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });
});
