import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// Test component that throws an error
const BuggyComponent = () => {
  throw new Error('Test error');
  return <div>This should not render</div>;
};

// Test component that works normally
const WorkingComponent = () => {
  return <div data-testid="working-component">Working component</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Mock console.error to prevent test noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('working-component')).toBeInTheDocument();
    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('should render error UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('should call error logging service when error occurs', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Test error'),
      });
    });
  });

  it('should store error in localStorage when API fails', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'errorLog',
        expect.stringContaining('Test error')
      );
    });
  });

  it('should allow retry when user clicks Try Again', () => {
    let shouldThrow = true;
    const ConditionalBuggyComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div data-testid="recovered-component">Recovered!</div>;
    };

    render(
      <ErrorBoundary>
        <ConditionalBuggyComponent />
      </ErrorBoundary>
    );

    // Should show error UI
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

    // Click try again
    fireEvent.click(screen.getByText('Try Again'));

    // Should recover and show working component
    expect(screen.getByText('Recovered!')).toBeInTheDocument();
    expect(screen.getByTestId('recovered-component')).toBeInTheDocument();
  });

  it('should handle custom fallback component', () => {
    const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('should call custom error handler if provided', () => {
    const mockErrorHandler = jest.fn();

    render(
      <ErrorBoundary onError={mockErrorHandler}>
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    const SimpleComponent = () => <div data-testid="simple">Simple</div>;
    const WrappedComponent = withErrorBoundary(SimpleComponent);

    render(<WrappedComponent />);

    expect(screen.getByTestId('simple')).toBeInTheDocument();
  });

  it('should have correct display name', () => {
    const SimpleComponent = () => <div>Simple</div>;
    SimpleComponent.displayName = 'SimpleComponent';
    
    const WrappedComponent = withErrorBoundary(SimpleComponent);
    
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(SimpleComponent)');
  });
});