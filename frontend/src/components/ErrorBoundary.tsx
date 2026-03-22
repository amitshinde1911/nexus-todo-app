import React, { ErrorInfo, ReactNode } from 'react';
import { logService } from '../services/logService';
import { auth } from '../config/firebase';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        
        const user = auth.currentUser;
        logService.logEvent({
            userId: user ? user.uid : 'anonymous',
            type: 'ERROR',
            action: 'UI_CRASH',
            message: error.message || 'Unknown Frontend Error',
            metadata: { 
                stack: error.stack,
                componentStack: errorInfo.componentStack 
            }
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', background: '#050505', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚠️</div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Something went wrong.</h1>
                    <p style={{ color: '#888', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
                        The application encountered an unexpected error. Don't worry, your data is safe in the cloud.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Reload Application
                    </button>
                    {import.meta.env.DEV && (
                        <pre style={{ marginTop: '40px', padding: '20px', background: '#111', borderRadius: '8px', textAlign: 'left', fontSize: '12px', overflow: 'auto', maxWidth: '80vw', border: '1px solid #333' }}>
                            {this.state.error?.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
