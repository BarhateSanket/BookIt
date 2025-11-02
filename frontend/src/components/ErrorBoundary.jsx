import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('UI Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-600">Please refresh the page or try again later.</p>
        </div>
      );
    }
    return this.props.children;
  }
}


