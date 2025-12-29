/**
 * Select Component Tests
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Select } from './Select';

// TODO: Fix Select test configuration issues
describe.skip('Select', () => {
  it('should render successfully', () => {
    render(
      <Select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render options', () => {
    render(
      <Select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </Select>
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should accept a default value', () => {
    render(
      <Select defaultValue="2">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('2');
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <Select disabled>
        <option value="1">Option 1</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(
      <Select className="custom-class">
        <option value="1">Option 1</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });

  it('should handle onChange events', () => {
    let selectedValue = '';
    render(
      <Select
        onChange={e => {
          selectedValue = e.target.value;
        }}
      >
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    select.value = '2';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(selectedValue).toBe('2');
  });
});
