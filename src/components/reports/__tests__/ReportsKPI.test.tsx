import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReportsKPI from '../ReportsKPI';
import { FileText } from 'lucide-react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div'
  }
}));

describe('ReportsKPI', () => {
  const defaultProps = {
    title: 'Test KPI',
    value: 1000,
    icon: FileText
  };

  it('should render title and value correctly', () => {
    render(<ReportsKPI {...defaultProps} />);
    
    expect(screen.getByText('Test KPI')).toBeInTheDocument();
    // Accept locale-dependent thousand separators (comma, space, non-breaking space)
    expect(
      screen.getByText(/^1[\u00A0\u202F\s,]000$/)
    ).toBeInTheDocument();
  });

  it('should format currency values correctly', () => {
    render(
      <ReportsKPI 
        {...defaultProps}
        value={1234.56}
        format="currency"
      />
    );
    
    // Accept either decimal currency (e.g., 1 234,56 €) or rounded whole (e.g., 1 235 €)
    const currencyElement = screen.getByText(
      /1[\u00A0\u202F\s,]234(?:[.,]56)?\s*€|1[\u00A0\u202F\s,]235\s*€/
    );
    expect(currencyElement).toBeInTheDocument();
  });

  it('should format percentage values correctly', () => {
    render(
      <ReportsKPI 
        {...defaultProps}
        value={85.7}
        format="percentage"
      />
    );
    
    expect(screen.getByText('85.7%')).toBeInTheDocument();
  });

  it('should display positive change indicator', () => {
    render(
      <ReportsKPI 
        {...defaultProps}
        change={12.5}
      />
    );
    
    expect(screen.getByText('12.5% vs période précédente')).toBeInTheDocument();
    // Should have green color class for positive change
    const changeElement = screen.getByText('12.5% vs période précédente').closest('div');
    expect(changeElement).toHaveClass('text-green-600');
  });

  it('should display negative change indicator', () => {
    render(
      <ReportsKPI 
        {...defaultProps}
        change={-8.3}
      />
    );
    
    expect(screen.getByText('8.3% vs période précédente')).toBeInTheDocument();
    // Should have red color class for negative change
    const changeElement = screen.getByText('8.3% vs période précédente').closest('div');
    expect(changeElement).toHaveClass('text-red-600');
  });

  it('should display trend information when provided', () => {
    render(
      <ReportsKPI 
        {...defaultProps}
        trend="Tendance positive"
      />
    );
    
    expect(screen.getByText('Tendance positive')).toBeInTheDocument();
  });

  it('should apply custom color classes', () => {
    render(
      <ReportsKPI 
        {...defaultProps}
        color="green"
      />
    );
    
    // Check if the icon container has the green color class
    const iconContainer = screen.getByRole('img', { hidden: true }).parentElement;
    expect(iconContainer).toHaveClass('bg-green-100');
  });

  it('should not display change when not provided', () => {
    render(<ReportsKPI {...defaultProps} />);
    
    expect(screen.queryByText(/% vs période précédente/)).not.toBeInTheDocument();
  });

  it('should handle zero change correctly', () => {
    render(
      <ReportsKPI 
        {...defaultProps}
        change={0}
      />
    );
    
    expect(screen.getByText('0% vs période précédente')).toBeInTheDocument();
    const changeElement = screen.getByText('0% vs période précédente').closest('div');
    expect(changeElement).toHaveClass('text-red-600'); // 0 is considered non-positive
  });

  it('should format large numbers correctly', () => {
    render(
      <ReportsKPI 
        {...defaultProps}
        value={1234567}
        format="number"
      />
    );
    // Accept locale-dependent thousand separators
    expect(
      screen.getByText(/^1[\u00A0\u202F\s,]234[\u00A0\u202F\s,]567$/)
    ).toBeInTheDocument();
  });

  it('should handle decimal values in currency format', () => {
    render(
      <ReportsKPI 
        {...defaultProps}
        value={999.99}
        format="currency"
      />
    );
    
    // Should display currency formatted version (rounded to nearest whole number)
    const currencyElement = screen.getByText(/999.*99.*€|1.*000.*€/);
    expect(currencyElement).toBeInTheDocument();
  });
});