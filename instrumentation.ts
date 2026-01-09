// Sentry instrumentation - only loads at runtime, not during build
export async function register() {
  // Skip if DSN is not present
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) {
    return;
  }

  // Only load configs at runtime, not during build
  // Use dynamic imports to avoid build-time issues
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // Dynamic import at runtime
      await import("./sentry.server.config");
    } catch (error) {
      // Silently fail in development
      if (process.env.NODE_ENV === "development") {
        console.warn("Sentry server config not loaded");
      }
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    try {
      await import("./sentry.edge.config");
    } catch (error) {
      // Silently fail in development
      if (process.env.NODE_ENV === "development") {
        console.warn("Sentry edge config not loaded");
      }
    }
  }
}

// Export onRequestError with lazy Sentry import
export async function onRequestError(error: Error, request: Request) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) {
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    
    // Convert Request to RequestInfo format expected by Sentry
    const requestInfo = {
      path: new URL(request.url).pathname,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    };
    
    // Extract errorContext from request or use defaults
    const errorContext = {
      routerKind: 'app-router', // Default for App Router
      routePath: new URL(request.url).pathname,
      routeType: 'route', // Default route type
    };
    
    return Sentry.captureRequestError(error, requestInfo, errorContext);
  } catch (e) {
    // Silently fail if Sentry not available
    console.warn("Sentry error capture failed:", e);
  }
}
