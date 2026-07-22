import { NodeSDK } from '@opentelemetry/sdk-node';
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
import { AUTH_HEADER, AXIOM, ENV } from '@/constants.js';

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
      '[observability] AXIOM_TOKEN/AXIOM_DATASET not set — tracing, metrics, and log shipping are disabled.',
    );
    return;
  }

  const token = process.env[ENV.AXIOM_TOKEN]!;
  const dataset = process.env[ENV.AXIOM_DATASET]!;
  // Axiom requires a distinct Metrics-type dataset (and header) from the
  // Events-type dataset used for traces/logs — see the AXIOM constant docs.
  const metricsDataset = process.env[ENV.AXIOM_METRICS_DATASET];

  const authHeader = { Authorization: `${AUTH_HEADER.BEARER_PREFIX}${token}` };

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: AXIOM.SERVICE_NAME,
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env[ENV.NODE_ENV] ?? 'development',
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${AXIOM.API_URL}${AXIOM.TRACES_PATH}`,
      headers: { ...authHeader, [AXIOM.DATASET_HEADER]: dataset },
    }),
    metricReaders: metricsDataset
      ? [
          new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
              url: `${AXIOM.API_URL}${AXIOM.METRICS_PATH}`,
              headers: { ...authHeader, [AXIOM.METRICS_DATASET_HEADER]: metricsDataset },
            }),
          }),
        ]
      : [],
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
