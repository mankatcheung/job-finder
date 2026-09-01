import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} from '@opentelemetry/semantic-conventions';
// `@fastify/otel` uses a CJS `export =` of a namespace; esModuleInterop's
// default-import synthesis resolves to that whole namespace rather than the
// class, so import the named export instead.
import { FastifyOtelInstrumentation } from '@fastify/otel';
import { AUTH_HEADER, AXIOM, ENV } from '#src/infrastructure/config/constants.js';

/**
 * Must be registered as a Fastify plugin in buildApp() *before* routes and
 * other plugins are defined (see app.ts) — that's how it's able to wrap every
 * route handler and lifecycle hook. Created unconditionally so app.ts always
 * has something to register; when Axiom isn't configured it just traces
 * against the global no-op tracer, so registering it costs nothing extra.
 */
export const fastifyOtelInstrumentation = new FastifyOtelInstrumentation();

/** True when enough config is present to ship traces and logs to Axiom. */
export const isObservabilityEnabled = Boolean(
  process.env[ENV.AXIOM_TOKEN] && process.env[ENV.AXIOM_DATASET],
);

let sdk: NodeSDK | undefined;
let spanProcessor: BatchSpanProcessor | undefined;
let metricReader: PeriodicExportingMetricReader | undefined;

/**
 * Awaitably flushes all buffered spans and metrics to their Axiom exporters.
 *
 * Vercel freezes the serverless function shortly after the HTTP response is
 * sent, so a `BatchSpanProcessor` relying on its own ~5s export timer (or the
 * default 60s metric collection interval) almost never gets to export before
 * the process is frozen. This is the primary export path: it's awaited in a
 * Fastify `onResponse` hook in buildApp(), which runs after each response is
 * written to the client but while the invocation is still alive. Combined with
 * the near-0 scheduled delay on the span processor, no buffered telemetry
 * survives a freeze. No-ops when the SDK never started.
 */
export async function flushObservability(): Promise<void> {
  if (!sdk) return;

  try {
    await Promise.all([spanProcessor?.forceFlush(), metricReader?.forceFlush()]);
  } catch (err: unknown) {
    console.error('[observability] flush error', err);
  }
}

/**
 * Starts the OpenTelemetry SDK, exporting traces (and, when configured,
 * metrics) to Axiom via OTLP. No-ops when AXIOM_TOKEN/AXIOM_DATASET aren't
 * set, so local dev works unchanged without Axiom credentials.
 *
 * Must be called before any instrumented module (http, fastify, etc.) is
 * imported anywhere in the process — see the import order in index.ts.
 */
export function startObservability(): void {
  if (!isObservabilityEnabled) {
    console.info(
      '[observability] AXIOM_TOKEN/AXIOM_DATASET not set — tracing and metrics are disabled.',
    );
    return;
  }

  const token = process.env[ENV.AXIOM_TOKEN]!;
  const dataset = process.env[ENV.AXIOM_DATASET]!;
  // Axiom requires a distinct Metrics-type dataset (and header) from the
  // Events-type dataset used for traces/logs — see the AXIOM constant docs.
  const metricsDataset = process.env[ENV.AXIOM_METRICS_DATASET];

  const authHeader = { Authorization: `${AUTH_HEADER.BEARER_PREFIX}${token}` };

  const traceExporter = new OTLPTraceExporter({
    url: `${AXIOM.API_URL}${AXIOM.TRACES_PATH}`,
    headers: { ...authHeader, [AXIOM.DATASET_HEADER]: dataset },
  });

  // Constructed explicitly (instead of letting NodeSDK build one from
  // `traceExporter`) so we hold the instance and can forceFlush() it from
  // flushObservability(). The near-0 scheduled delay is defense-in-depth for
  // the serverless freeze window — see flushObservability()'s doc.
  spanProcessor = new BatchSpanProcessor({
    exporter: traceExporter,
    scheduledDelayMillis: 0,
  });

  if (metricsDataset) {
    metricReader = new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${AXIOM.API_URL}${AXIOM.METRICS_PATH}`,
        headers: { ...authHeader, [AXIOM.METRICS_DATASET_HEADER]: metricsDataset },
      }),
    });
  }

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: AXIOM.SERVICE_NAME,
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env[ENV.NODE_ENV] ?? 'development',
    }),
    spanProcessors: [spanProcessor],
    metricReaders: metricReader ? [metricReader] : [],
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disabled: fires on every file read/write (module loading, temp
        // files, log writes) and drowns out application-relevant spans.
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
      fastifyOtelInstrumentation,
    ],
  });

  sdk.start();

  if (!metricsDataset) {
    console.info(
      '[observability] AXIOM_METRICS_DATASET not set — metrics export is disabled (traces and logs are still active).',
    );
  }

  const shutdown = () => {
    sdk?.shutdown().catch((err: unknown) => console.error('[observability] shutdown error', err));
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  console.info(`[observability] Axiom tracing enabled${metricsDataset ? ' with metrics' : ''}.`);
}
