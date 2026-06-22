import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f141d 0%, #182232 55%, #111827 100%)',
            color: '#e2e8f0',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '1rem',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '2.5rem 2rem',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>♔</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              An unexpected error occurred. You can try reloading the page or resetting the app.
            </p>
            {this.state.error && (
              <pre
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.4)',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1.5rem',
                  overflow: 'auto',
                  maxHeight: '120px',
                  textAlign: 'left',
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: '#0bb0e5',
                  color: '#042130',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
