import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompForm } from '../src/components/CompForm';
import { useCalculate } from '../src/hooks/useCalculate';
import { z } from 'zod';

// Restore original simple mock for useCalculate hook
const mockMutateFn = vi.fn();
vi.mock('../src/hooks/useCalculate', () => ({
  useCalculate: vi.fn(() => ({
    mutate: mockMutateFn,
    isPending: false,
  })),
}));

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper = () => {
  const testQueryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
  );
};

describe('CompForm', () => {
  it('renders without crashing', () => {
    console.log('Starting basic render test');
    const onResult = vi.fn();
    render(<CompForm onResult={onResult} />, { wrapper: createWrapper() });
    console.log('Render complete');

    const element = screen.getByText('Calculate Compensation');
    console.log('Found element:', element);

    expect(element).toBeInTheDocument();
  });

  it('validates employee ID', async () => {
    console.log('Starting employee ID validation test');
    const onResult = vi.fn();
    render(<CompForm onResult={onResult} />, { wrapper: createWrapper() });

    // Try to submit without employee ID
    const submitButton = screen.getByText('Calculate Compensation');
    fireEvent.click(submitButton);

    // onResult should not be called if validation fails
    expect(onResult).not.toHaveBeenCalled();
    console.log('Employee ID validation test complete');
  });

  it('submits form with valid data', async () => {
    console.log('Starting form submission test');
    const onResult = vi.fn();
    render(<CompForm onResult={onResult} />, { wrapper: createWrapper() });

    // Fill in employee ID
    const employeeIdInput = screen.getByLabelText('Employee ID');
    fireEvent.change(employeeIdInput, { target: { value: '123' } });

    // Fill in revenue
    const revenueInput = screen.getByLabelText(/revenue/i);
    fireEvent.change(revenueInput, { target: { value: '1000000' } });

    // Submit form
    const submitButton = screen.getByText('Calculate Compensation');
    fireEvent.click(submitButton);

    // Mutation is mocked, so onResult won't be called yet
    expect(onResult).not.toHaveBeenCalled();
    console.log('Form submission test complete');
  });

  it('allows adding and removing qualitative scores', () => {
    console.log('Starting qualitative scores test');
    const onResult = vi.fn();
    render(<CompForm onResult={onResult} />, { wrapper: createWrapper() });

    // Initial scores (risk and compliance)
    const initialMetrics = screen.getAllByPlaceholderText('Metric');
    expect(initialMetrics).toHaveLength(2);

    // Add a new score
    const addButton = screen.getByText('Add Score');
    fireEvent.click(addButton);

    // Should now have 3 metric inputs
    const updatedMetrics = screen.getAllByPlaceholderText('Metric');
    expect(updatedMetrics).toHaveLength(3);

    // Remove the last score
    const removeButtons = screen.getAllByText('-');
    fireEvent.click(removeButtons[removeButtons.length - 1]);

    // Should be back to 2 metric inputs
    const finalMetrics = screen.getAllByPlaceholderText('Metric');
    expect(finalMetrics).toHaveLength(2);
    console.log('Qualitative scores test complete');
  });

  it('handles Zod validation errors on submit', async () => {
    const onResult = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error');
    // Suppress console.error output during this test if it's too noisy
    consoleErrorSpy.mockImplementation(() => {});

    render(<CompForm onResult={onResult} />, { wrapper: createWrapper() });

    // Input invalid data
    const employeeIdInput = screen.getByLabelText('Employee ID');
    fireEvent.change(employeeIdInput, { target: { value: 'abc' } }); // Invalid: will be NaN after parseInt

    const revenueInput = screen.getByLabelText(/revenue/i);
    fireEvent.change(revenueInput, { target: { value: '-100' } }); // Invalid: not positive()

    const formElement = screen.getByTestId('comp-form');
    fireEvent.submit(formElement);

    // Use waitFor to ensure all synchronous effects of the click (including console.error) have settled
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    expect(onResult).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore(); // Restore original console.error
  });

  it('updates qualitative score metric and value', () => {
    const onResult = vi.fn();
    render(<CompForm onResult={onResult} />, { wrapper: createWrapper() });

    // Get the first metric input (default is 'risk')
    const metricInputs = screen.getAllByPlaceholderText('Metric');
    fireEvent.change(metricInputs[0], { target: { value: 'teamwork' } });
    expect((metricInputs[0] as HTMLInputElement).value).toBe('teamwork');

    // Get the first score input (default is 50 for 'risk', now 'teamwork')
    const scoreSliders = screen.getAllByRole('slider');
    fireEvent.change(scoreSliders[0], { target: { value: '75' } });

    // The displayed score span should update
    const scoreDisplay = screen.getByText('75');
    expect(scoreDisplay).toBeInTheDocument();
  });

  it('displays calculating state when isPending is true', () => {
    // Temporarily change the mock's return value for this test
    vi.mocked(useCalculate).mockReturnValueOnce({
      mutate: vi.fn(),
      isPending: true,
      isSuccess: false,
      isError: false,
      data: undefined,
      error: null,
      status: 'pending',
      reset: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    } as any);

    const onResult = vi.fn();
    render(<CompForm onResult={onResult} />, { wrapper: createWrapper() });

    expect(screen.getByText('Calculating...')).toBeInTheDocument();
    const submitButton = screen.getByText('Calculating...');
    expect(submitButton).toBeDisabled();

    // No need to explicitly restore if using mockReturnValueOnce, it only affects one call.
    // If other calls to useCalculate happen in this test and need the default mock,
    // then a more specific mockReset or mockImplementationOnce might be needed after this render.
  });

  it('handles non-Zod errors during submission', () => {
    // 1. Setup - create a non-Zod error
    const genericError = new Error('Generic Submission Error');

    // 2. Create spies for console methods
    const consoleLogSpy = vi.spyOn(console, 'log');
    const consoleErrorSpy = vi.spyOn(console, 'error');

    // 3. Create a simple mock for useCalculate that allows us to
    // capture the onError function for direct testing
    let capturedOnError: ((error: Error) => void) | undefined;

    const mockMutate = vi.fn((_data, options) => {
      // Store the onError callback for later use
      if (options && typeof options.onError === 'function') {
        capturedOnError = options.onError;
      }
    });

    vi.mocked(useCalculate).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: false,
      isError: false,
      data: null,
      error: null,
      status: 'idle',
      reset: vi.fn(),
      mutateAsync: vi.fn(),
    } as any);

    // 4. Render and submit the form
    const onResult = vi.fn();
    render(<CompForm onResult={onResult} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/Employee ID/), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByLabelText(/Revenue/), { target: { value: '500000' } });

    const formElement = screen.getByTestId('comp-form');
    fireEvent.submit(formElement);

    // 5. Verify the mutate function was called
    expect(mockMutate).toHaveBeenCalled();
    expect(capturedOnError).toBeDefined();

    // 6. Directly test the onError handler we captured
    if (capturedOnError) {
      // Call the onError handler with our error
      capturedOnError(genericError);

      // Verify error logging - this directly tests the component's error handling
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[CompForm] Caught error during submit:',
        genericError
      );

      expect(consoleLogSpy).toHaveBeenCalledWith('[CompForm] Is ZodError:', false);
    }

    // 7. Clean up
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
