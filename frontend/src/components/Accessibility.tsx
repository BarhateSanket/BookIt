import './Accessibility.css';
import React from 'react';

// Focus management utilities
export class FocusManager {
  static focusTrap(element: HTMLElement) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
      
      if (e.key === 'Escape') {
        // Handle escape key
        element.dispatchEvent(new CustomEvent('escape'));
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }

  static trapFocus(container: HTMLElement) {
    return this.focusTrap(container);
  }
}

// Accessibility utility components
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white px-4 py-2 rounded-br-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </a>
  );
}

interface LiveRegionProps {
  message: string;
  level?: 'polite' | 'assertive';
  'aria-label'?: string;
}

export function LiveRegion({ message, level = 'polite', 'aria-label': ariaLabel }: LiveRegionProps) {
  const validLevel = typeof level === 'string' && (level === 'polite' || level === 'assertive') ? level : 'polite';
  const validAriaLabel = typeof ariaLabel === 'string' ? ariaLabel : undefined;

  return (
    <div
      {...(validLevel === 'assertive' ? { 'aria-live': 'assertive' } : { 'aria-live': 'polite' })}
      {...(validAriaLabel ? { 'aria-label': validAriaLabel } : {})}
      role="status"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Button with accessibility features
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function AccessibleButton({
  children,
  loading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: AccessibleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={classes}
      {...(loading ? { 'aria-busy': 'true' } : {})}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{loadingText || 'Loading...'}</span>
        </>
      ) : (
        <>
          {icon && <span className="mr-2" aria-hidden="true">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

// Form field with accessibility
interface AccessibleFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  id?: string;
}

export function AccessibleFormField({
  label,
  error,
  helperText,
  required,
  id,
  className = '',
  ...props
}: AccessibleFormFieldProps) {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      <input
        {...props}
        id={fieldId}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700'
        } dark:text-white`}
        {...(error ? { 'aria-invalid': 'true' } : {})}
        aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
        required={required}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

// Micro-interactions and animations
interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}

export function HoverScale({ children, scale = 1.05, duration = 200, className = '' }: HoverScaleProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--scale', scale.toString());
      ref.current.style.setProperty('--duration', `${duration}ms`);
    }
  }, [scale, duration]);

  return (
    <div
      ref={ref}
      className={`hover-scale ${className}`}
    >
      {children}
    </div>
  );
}

// Fade in animation component
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 300, 
  className = '', 
  direction = 'up' 
}: FadeInProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const directionStyles = {
    up: { transform: 'translateY(20px)' },
    down: { transform: 'translateY(-20px)' },
    left: { transform: 'translateX(20px)' },
    right: { transform: 'translateX(-20px)' }
  };

  return (
    <div
      ref={ref}
      className={`fade-in ${className}`}
      style={{
        '--opacity': isVisible ? 1 : 0,
        '--transform': isVisible ? 'translate(0, 0)' : directionStyles[direction].transform,
        '--duration': `${duration}ms`,
        '--delay': `${delay}ms`
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Button with ripple effect
interface RippleButtonProps extends Omit<AccessibleButtonProps, 'children'> {
  children: React.ReactNode;
}

export function RippleButton({ children, className = '', ...props }: RippleButtonProps) {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  return (
    <AccessibleButton
      {...props}
      className={`relative overflow-hidden ${className}`}
      onClick={createRipple}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple-span absolute bg-white bg-opacity-30 rounded-full pointer-events-none animate-ping"
          style={{
            '--left': `${ripple.x}px`,
            '--top': `${ripple.y}px`,
            '--width': '100px',
            '--height': '100px',
            '--margin-left': '-50px',
            '--margin-top': '-50px'
          } as React.CSSProperties}
        />
      ))}
    </AccessibleButton>
  );
}

// Loading state with skeleton
interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  className?: string;
}

export function LoadingState({ isLoading, children, skeleton, className = '' }: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className={className}>
        {skeleton || <div className="animate-pulse bg-gray-200 h-4 rounded" />}
      </div>
    );
  }

  return <>{children}</>;
}

// Error state component
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this content.',
  onRetry,
  retryLabel = 'Try again'
}: ErrorStateProps) {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 mx-auto mb-4 text-red-500">
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

// Keyboard shortcuts help
export function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            setShowHelp(true);
            break;
          case '/':
            e.preventDefault();
            // Focus search
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
            searchInput?.focus();
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Search</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl + /</kbd>
          </div>
          <div className="flex justify-between">
            <span>Show shortcuts</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl + K</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}