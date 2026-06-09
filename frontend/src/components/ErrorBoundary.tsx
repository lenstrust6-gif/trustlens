'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: (error: Error) => React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught:', error, errorInfo)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
  }

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'Unknown error'
      const errorStack = this.state.error?.stack || ''
      console.log('ErrorBoundary rendering with error:', errorMsg)
      return (
        this.props.fallback?.(this.state.error!) || (
          <div style={{ padding: '20px', color: 'red', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px' }}>
            <h2>Something went wrong</h2>
            <p><strong>Error:</strong> {errorMsg}</p>
            <p><strong>Stack:</strong></p>
            <p>{errorStack}</p>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
