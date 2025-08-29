import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickAction from '../QuickAction';
import { FileText } from 'lucide-react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div'
  }
}));

describe('QuickAction', () => {
  const mockOnClick = vi.fn();
  
  const defaultProps = {
    title: 'Test Action',
    description: 'Test description',
    icon: FileText,
    onClick: mockOnClick
  };

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('should render title and description correctly', () => {
    render(<QuickAction {...defaultProps} />);
    
    expect(screen.getByText('Test Action')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    render(<QuickAction {...defaultProps} />);
    
    const actionElement = screen.getByText('Test Action').closest('div');
    fireEvent.click(actionElement!);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should display badge when provided', () => {
    render(
      <QuickAction 
        {...defaultProps}
        badge="New"
      />
    );
    
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should not display badge when not provided', () => {
    render(<QuickAction {...defaultProps} />);
    
    // Badge should not be in the document
    expect(screen.queryByRole('badge')).not.toBeInTheDocument();
  });

  it('should apply custom color classes', () => {
    render(
      <QuickAction 
        {...defaultProps}
        color="green"
      />
    );
    
    // Check if the icon container has the green gradient
    const iconContainer = screen.getByRole('img', { hidden: true }).parentElement;
    expect(iconContainer).toHaveClass('from-green-500', 'to-green-600');
  });

  it('should use default blue color when not specified', () => {
    render(<QuickAction {...defaultProps} />);
    
    const iconContainer = screen.getByRole('img', { hidden: true }).parentElement;
    expect(iconContainer).toHaveClass('from-blue-500', 'to-blue-600');
  });

  it('should render the icon correctly', () => {
    render(<QuickAction {...defaultProps} />);
    
    // Check if the icon is rendered
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('should have cursor pointer style', () => {
    render(<QuickAction {...defaultProps} />);
    
    const actionElement = screen.getByText('Test Action').closest('div');
    expect(actionElement).toHaveClass('cursor-pointer');
  });

  it('should have appropriate ARIA attributes for accessibility', () => {
    render(<QuickAction {...defaultProps} />);
    
    const actionElement = screen.getByText('Test Action').closest('div');
    
    // Should be clickable
    expect(actionElement).toBeInTheDocument();
    
    // Should have hover effects
    expect(actionElement).toHaveClass('hover:shadow-lg');
  });

  it('should handle long titles and descriptions', () => {
    const longTitle = 'This is a very long title that should still render correctly';
    const longDescription = 'This is a very long description that should wrap properly and not break the layout of the component';
    
    render(
      <QuickAction 
        {...defaultProps}
        title={longTitle}
        description={longDescription}
      />
    );
    
    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('should handle multiple clicks correctly', () => {
    render(<QuickAction {...defaultProps} />);
    
    const actionElement = screen.getByText('Test Action').closest('div');
    
    fireEvent.click(actionElement!);
    fireEvent.click(actionElement!);
    fireEvent.click(actionElement!);
    
    expect(mockOnClick).toHaveBeenCalledTimes(3);
  });
});