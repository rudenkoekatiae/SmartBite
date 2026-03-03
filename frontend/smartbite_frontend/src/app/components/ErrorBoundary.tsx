import React from 'react';
import { Link } from 'react-router-dom';

// minimal class-based error boundary
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // you could log to a monitoring service here
    console.error('Uncaught error in boundary', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-black text-red-700 mb-4">Something went wrong</h2>
          <p className="mb-6">{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <Link to="/" className="text-green-600 font-bold underline">
            Go back home
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}
