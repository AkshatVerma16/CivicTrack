import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo })
    // You can also log error to an error reporting service here
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32 }}>
          <h1 style={{ color: 'red' }}>Something went wrong.</h1>
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
          {this.state.errorInfo && (
            <details style={{ whiteSpace: 'pre-wrap', color: 'gray' }}>
              {this.state.errorInfo.componentStack}
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
