import React, { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TactilePressable } from './TactilePressable';
import { textStyle } from '../../theme/typography';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.warn('[ErrorBoundary] Caught:', error.message, errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>😕</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtitle}>Try again or restart the app</Text>
      <TactilePressable onPress={onRetry} haptic="commit" style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </TactilePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FAF8F5' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#1B1816', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B6560', marginBottom: 20 },
  retryButton: { backgroundColor: '#FF6B35', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: '#fff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});
