/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
}

module.exports = nextConfig



// Injected content via Sentry wizard below
// Only enable Sentry if DSN is present to avoid build hangs

if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
  const { withSentryConfig } = require("@sentry/nextjs");

  // Only wrap with Sentry config if auth token is present (for source map uploads)
  const sentryConfig = process.env.SENTRY_AUTH_TOKEN
    ? {
        // For all available options, see:
        // https://www.npmjs.com/package/@sentry/webpack-plugin#options

        org: process.env.SENTRY_ORG || "bippityboo",
        project: process.env.SENTRY_PROJECT || "javascript-nextjs",

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
        // This can increase your server load as well as your hosting bill.
        // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
        // side errors will fail.
        tunnelRoute: "/monitoring",

        webpack: {
          // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
          // See the following for more information:
          // https://docs.sentry.io/product/crons/
          // https://vercel.com/docs/cron-jobs
          automaticVercelMonitors: true,

          // Tree-shaking options for reducing bundle size
          treeshake: {
            // Automatically tree-shake Sentry logger statements to reduce bundle size
            removeDebugLogging: true,
          },
        },
      }
    : {
        // Disable source map uploads if auth token is not present
        silent: true,
        disableClientWebpackPlugin: true,
        disableServerWebpackPlugin: true,
        // Still keep tunnel route for error reporting
        tunnelRoute: "/monitoring",
      };

  module.exports = withSentryConfig(module.exports, sentryConfig);
}
