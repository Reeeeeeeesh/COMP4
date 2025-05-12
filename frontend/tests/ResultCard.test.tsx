import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ResultCard } from '../src/components/ResultCard';
import type { CompResult } from '../src/api/client';

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createTestWrapper = () => {
  const testQueryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
  );
};

const mockResult: CompResult = {
  total_comp: 150000,
  base: 100000,
  bonus: 30000,
  revenue_adjustment: 15000,
  qualitative_adjustment: 5000,
  breaches: [],
};

const mockZeroResult: CompResult = {
  total_comp: 0,
  base: 0,
  bonus: 0,
  revenue_adjustment: 0,
  qualitative_adjustment: 0,
  breaches: [],
};

const mockLargeResult: CompResult = {
  total_comp: 1000000000,
  base: 500000000,
  bonus: 300000000,
  revenue_adjustment: 150000000,
  qualitative_adjustment: 50000000,
  breaches: [],
};

describe('ResultCard', () => {
  it('renders without crashing', () => {
    console.log('Starting basic render test');
    render(<ResultCard result={mockResult} />, { wrapper: createTestWrapper() });
    console.log('Render complete');

    const element = screen.getByText('Compensation Breakdown');
    console.log('Found element:', element);

    expect(element).toBeInTheDocument();
  });

  it('displays compensation breakdown', () => {
    console.log('Starting compensation breakdown test');
    render(<ResultCard result={mockResult} />, { wrapper: createTestWrapper() });

    // Check if all the compensation values are displayed
    expect(screen.getByText('$150,000')).toBeInTheDocument(); // Total
    expect(screen.getByText('$100,000')).toBeInTheDocument(); // Base
    expect(screen.getByText('$30,000')).toBeInTheDocument(); // Bonus
    expect(screen.getByText('$20,000')).toBeInTheDocument(); // Adjustments

    console.log('Compensation breakdown test complete');
  });

  it('switches between pie and bar charts', () => {
    console.log('Starting chart switching test');
    render(<ResultCard result={mockResult} />, { wrapper: createTestWrapper() });

    // Should start with pie chart
    const pieButton = screen.getByRole('button', { name: /pie/i });
    const barButton = screen.getByRole('button', { name: /bar/i });

    expect(pieButton).toHaveClass('bg-blue-500');
    expect(barButton).not.toHaveClass('bg-blue-500');

    // Switch to bar chart
    fireEvent.click(barButton);

    expect(barButton).toHaveClass('bg-blue-500');
    expect(pieButton).not.toHaveClass('bg-blue-500');

    console.log('Chart switching test complete');
  });

  it('displays breaches when present', () => {
    console.log('Starting breaches test');
    const resultWithBreaches: CompResult = {
      ...mockResult,
      breaches: ['Exceeds maximum bonus', 'Invalid score range'],
    };

    render(<ResultCard result={resultWithBreaches} />, {
      wrapper: createTestWrapper(),
    });

    // Check breach section and messages
    expect(screen.getByText('Breaches')).toBeInTheDocument();
    expect(screen.getByText('Exceeds maximum bonus')).toBeInTheDocument();
    expect(screen.getByText('Invalid score range')).toBeInTheDocument();

    console.log('Breaches test complete');
  });

  it('handles zero values correctly', () => {
    console.log('Starting zero values test');
    render(<ResultCard result={mockZeroResult} />, { wrapper: createTestWrapper() });

    // Check if zero values are displayed correctly
    const zeroElements = screen.getAllByText(/\$0/i);
    expect(zeroElements).toHaveLength(4); // Should find 4 instances of $0

    console.log('Zero values test complete');
  });

  it('verifies chart data rendering', () => {
    console.log('Starting chart data test');
    render(<ResultCard result={mockResult} />, { wrapper: createTestWrapper() });

    // Verify base data is displayed
    expect(screen.getByText('Base Salary')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();

    // Verify bonus data
    expect(screen.getByText('Bonus')).toBeInTheDocument();
    expect(screen.getByText('$30,000')).toBeInTheDocument();

    // Verify adjustments
    expect(screen.getByText('Adjustments')).toBeInTheDocument();
    expect(screen.getByText('$20,000')).toBeInTheDocument();

    // Switch to bar chart
    fireEvent.click(screen.getByRole('button', { name: /bar/i }));

    // Verify chart container still exists
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();

    console.log('Chart data test complete');
  });

  it('updates chart data when props change', () => {
    console.log('Starting chart data update test');
    const { rerender } = render(<ResultCard result={mockResult} />, {
      wrapper: createTestWrapper(),
    });

    // Initial render
    expect(screen.getByText('$150,000')).toBeInTheDocument();

    // Update with new data
    const updatedResult: CompResult = {
      ...mockResult,
      total_comp: 200000,
      base: 120000,
      bonus: 50000,
      revenue_adjustment: 20000,
      qualitative_adjustment: 10000,
    };

    rerender(<ResultCard result={updatedResult} />);

    // Verify updated values
    expect(screen.getByText('$200,000')).toBeInTheDocument();
    expect(screen.getByText('$120,000')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('$30,000')).toBeInTheDocument(); // Combined adjustments

    console.log('Chart data update test complete');
  });

  it('verifies chart data is correctly formatted', () => {
    console.log('Starting chart data test');
    render(<ResultCard result={mockResult} />, { wrapper: createTestWrapper() });

    // Verify pie chart data
    const pieButton = screen.getByRole('button', { name: /pie/i });
    expect(pieButton).toHaveClass('bg-blue-500');

    // Verify chart container exists
    const chartContainer = screen.getByTestId('chart-container');
    expect(chartContainer).toBeInTheDocument();

    // Switch to bar chart and verify
    fireEvent.click(screen.getByRole('button', { name: /bar/i }));
    expect(pieButton).not.toHaveClass('bg-blue-500');

    console.log('Chart data test complete');
  });

  it('handles invalid or missing data gracefully', () => {
    console.log('Starting error handling test');
    const partialResult = {
      total_comp: 150000,
      base: 100000,
      bonus: 30000,
      revenue_adjustment: undefined,
      qualitative_adjustment: undefined,
      breaches: [],
    } as unknown as CompResult;

    render(<ResultCard result={partialResult} />, { wrapper: createTestWrapper() });

    // Should display values for defined fields
    expect(screen.getByText('$150,000')).toBeInTheDocument(); // Total
    expect(screen.getByText('$100,000')).toBeInTheDocument(); // Base
    expect(screen.getByText('$30,000')).toBeInTheDocument(); // Bonus
    expect(screen.getByText('$0')).toBeInTheDocument(); // Adjustments

    console.log('Error handling test complete');
  });

  it('formats large numbers correctly', () => {
    console.log('Starting large numbers test');
    render(<ResultCard result={mockLargeResult} />, { wrapper: createTestWrapper() });

    // Check if large numbers are formatted correctly
    expect(screen.getByText('$1,000,000,000')).toBeInTheDocument(); // Total
    expect(screen.getByText('$500,000,000')).toBeInTheDocument(); // Base
    expect(screen.getByText('$300,000,000')).toBeInTheDocument(); // Bonus
    expect(screen.getByText('$200,000,000')).toBeInTheDocument(); // Adjustments

    console.log('Large numbers test complete');
  });

  it('handles negative values correctly', () => {
    console.log('Starting negative values test');
    const negativeResult: CompResult = {
      ...mockResult,
      revenue_adjustment: -5000,
      qualitative_adjustment: -3000,
    };

    render(<ResultCard result={negativeResult} />, {
      wrapper: createTestWrapper(),
    });

    // Should display negative adjustments
    expect(screen.getByText('-$8,000')).toBeInTheDocument();

    console.log('Negative values test complete');
  });

  it('handles empty breaches array correctly', () => {
    console.log('Starting empty breaches test');
    const resultWithoutBreaches: CompResult = {
      ...mockResult,
      breaches: [],
    };

    render(<ResultCard result={resultWithoutBreaches} />, {
      wrapper: createTestWrapper(),
    });

    // Should not display breaches section
    expect(screen.queryByText('Breaches')).not.toBeInTheDocument();

    console.log('Empty breaches test complete');
  });

  it('handles chart interactions correctly', () => {
    console.log('Starting chart interactions test');
    render(<ResultCard result={mockResult} />, { wrapper: createTestWrapper() });

    // Switch between chart types multiple times
    const pieButton = screen.getByRole('button', { name: /pie/i });
    const barButton = screen.getByRole('button', { name: /bar/i });

    fireEvent.click(barButton);
    expect(barButton).toHaveClass('bg-blue-500');

    fireEvent.click(pieButton);
    expect(pieButton).toHaveClass('bg-blue-500');

    fireEvent.click(barButton);
    expect(barButton).toHaveClass('bg-blue-500');

    console.log('Chart interactions test complete');
  });
});
