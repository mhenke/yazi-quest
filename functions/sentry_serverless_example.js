// Example Sentry Serverless initialization for Google Cloud Functions
// DO NOT commit your DSN to source control. Set it in environment variables.
// To test error reporting from Google Cloud, add `?failure=true` to the request URL.
// Example test timestamp: 2025-12-21T18:28:30.603Z

const Sentry = require("@sentry/google-cloud-serverless");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN || '',
  integrations: [
    nodeProfilingIntegration(),
  ],
  enableLogs: true,
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: 'trace',
  sendDefaultPii: true,
});

// HTTP function example: throws when ?failure=true present
exports.helloHttp = Sentry.wrapHttpFunction((req, res) => {
  try {
    const query = req.query || {};
    const url = req.url || '';
    const failure = (typeof query.failure !== 'undefined' && String(query.failure) === 'true') || url.includes('failure=true');
    if (failure) {
      // Send a log and metric before throwing to test log/metric capture
      if (Sentry && Sentry.logger && Sentry.logger.info) {
        Sentry.logger.info('User triggered test error', { action: 'test_error_function' });
      }
      if (Sentry && Sentry.metrics && Sentry.metrics.count) {
        try { Sentry.metrics.count('test_counter', 1); } catch (e) { /* ignore */ }
      }

      // Start a span to demonstrate profiling/tracing attachments
      let span;
      try {
        span = Sentry.startSpan ? Sentry.startSpan({ name: 'serverless_test_span' }) : null;
      } catch (e) {}

      // Intentional error to verify Sentry integration
      throw new Error('oh, hello there!');
    }
    res.status(200).send('Hello from instrumented function');
  } catch (err) {
    // Let Sentry capture and then rethrow to ensure invocation is marked as failed
    throw err;
  }
});

// Background function example
exports.helloEvent = Sentry.wrapEventFunction((data, context, callback) => {
  // Your background function logic
  return callback();
});
