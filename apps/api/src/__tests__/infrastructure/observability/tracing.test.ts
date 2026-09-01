import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AXIOM, ENV } from '#src/infrastructure/config/constants.js';
import {
  ATTR_SERVICE_NAME,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} from '@opentelemetry/semantic-conventions';

const {
  nodeSDKConstructorMock,
  nodeSDKStartMock,
  otlpTraceExporterMock,
  otlpMetricExporterMock,
  periodicReaderMock,
  batchSpanProcessorInstances,
  metricReaderInstances,
  getNodeAutoInstrumentationsMock,
} = vi.hoisted(() => ({
  nodeSDKConstructorMock: vi.fn(),
  nodeSDKStartMock: vi.fn(),
  otlpTraceExporterMock: vi.fn(),
  otlpMetricExporterMock: vi.fn(),
  periodicReaderMock: vi.fn(),
  batchSpanProcessorInstances: [] as Array<{
    exporter: unknown;
    config: unknown;
    forceFlush: ReturnType<typeof vi.fn>;
  }>,
  metricReaderInstances: [] as Array<{
    config: unknown;
    forceFlush: ReturnType<typeof vi.fn>;
  }>,
  getNodeAutoInstrumentationsMock: vi.fn().mockReturnValue(['auto-instrumentations']),
}));

vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: class {
    constructor(config: unknown) {
      nodeSDKConstructorMock(config);
    }
    start() {
      nodeSDKStartMock();
    }
    shutdown() {
      return Promise.resolve();
    }
  },
}));

vi.mock('@opentelemetry/exporter-trace-otlp-proto', () => ({
  OTLPTraceExporter: class {
    constructor(config: unknown) {
      otlpTraceExporterMock(config);
    }
  },
}));

vi.mock('@opentelemetry/exporter-metrics-otlp-proto', () => ({
  OTLPMetricExporter: class {
    constructor(config: unknown) {
      otlpMetricExporterMock(config);
    }
  },
}));

vi.mock('@opentelemetry/sdk-metrics', () => ({
  PeriodicExportingMetricReader: class {
    forceFlush: ReturnType<typeof vi.fn>;
    constructor(config: unknown) {
      periodicReaderMock(config);
      this.forceFlush = vi.fn().mockResolvedValue(undefined);
      metricReaderInstances.push({ config, forceFlush: this.forceFlush });
    }
  },
}));

vi.mock('@opentelemetry/sdk-trace', () => ({
  BatchSpanProcessor: class {
    forceFlush: ReturnType<typeof vi.fn>;
    constructor(options: { exporter: unknown; scheduledDelayMillis?: number }) {
      this.forceFlush = vi.fn().mockResolvedValue(undefined);
      batchSpanProcessorInstances.push({
        exporter: options.exporter,
        config: { scheduledDelayMillis: options.scheduledDelayMillis },
        forceFlush: this.forceFlush,
      });
    }
  },
}));

vi.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: getNodeAutoInstrumentationsMock,
}));

vi.mock('@fastify/otel', () => ({
  FastifyOtelInstrumentation: class {
    plugin() {
      return vi.fn();
    }
  },
}));

const ENV_KEYS = [
  ENV.AXIOM_TOKEN,
  ENV.AXIOM_DATASET,
  ENV.AXIOM_METRICS_DATASET,
  ENV.NODE_ENV,
] as const;

async function loadTracingModule() {
  vi.resetModules();
  return import('#src/infrastructure/observability/tracing.js');
}

describe('tracing', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    batchSpanProcessorInstances.length = 0;
    metricReaderInstances.length = 0;
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    for (const key of ENV_KEYS) delete process.env[key];
  });

  describe('isObservabilityEnabled', () => {
    it('is false when neither AXIOM_TOKEN nor AXIOM_DATASET is set', async () => {
      const mod = await loadTracingModule();
      expect(mod.isObservabilityEnabled).toBe(false);
    });

    it('is false when only AXIOM_TOKEN is set', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'token';
      const mod = await loadTracingModule();
      expect(mod.isObservabilityEnabled).toBe(false);
    });

    it('is false when only AXIOM_DATASET is set', async () => {
      process.env[ENV.AXIOM_DATASET] = 'dataset';
      const mod = await loadTracingModule();
      expect(mod.isObservabilityEnabled).toBe(false);
    });

    it('is true when both AXIOM_TOKEN and AXIOM_DATASET are set', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'token';
      process.env[ENV.AXIOM_DATASET] = 'dataset';
      const mod = await loadTracingModule();
      expect(mod.isObservabilityEnabled).toBe(true);
    });
  });

  describe('startObservability', () => {
    it('does not construct the SDK when Axiom is not configured', async () => {
      const mod = await loadTracingModule();
      mod.startObservability();

      expect(nodeSDKConstructorMock).not.toHaveBeenCalled();
      expect(nodeSDKStartMock).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('AXIOM_TOKEN/AXIOM_DATASET not set'),
      );
    });

    it('configures the trace exporter with the Bearer token and dataset header', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'secret-token';
      process.env[ENV.AXIOM_DATASET] = 'my-dataset';
      const mod = await loadTracingModule();

      mod.startObservability();

      expect(otlpTraceExporterMock).toHaveBeenCalledWith({
        url: `${AXIOM.API_URL}${AXIOM.TRACES_PATH}`,
        headers: {
          Authorization: 'Bearer secret-token',
          [AXIOM.DATASET_HEADER]: 'my-dataset',
        },
      });
      expect(nodeSDKStartMock).toHaveBeenCalledOnce();
    });

    it('sets service name and deployment environment on the resource', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'secret-token';
      process.env[ENV.AXIOM_DATASET] = 'my-dataset';
      process.env[ENV.NODE_ENV] = 'production';
      const mod = await loadTracingModule();

      mod.startObservability();

      const [config] = nodeSDKConstructorMock.mock.calls[0] as [
        { resource: { attributes: Record<string, unknown> } },
      ];
      expect(config.resource.attributes[ATTR_SERVICE_NAME]).toBe(AXIOM.SERVICE_NAME);
      expect(config.resource.attributes[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('production');
    });

    it('defaults the deployment environment to "development" when NODE_ENV is unset', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'secret-token';
      process.env[ENV.AXIOM_DATASET] = 'my-dataset';
      const mod = await loadTracingModule();

      mod.startObservability();

      const [config] = nodeSDKConstructorMock.mock.calls[0] as [
        { resource: { attributes: Record<string, unknown> } },
      ];
      expect(config.resource.attributes[ATTR_DEPLOYMENT_ENVIRONMENT_NAME]).toBe('development');
    });

    it('omits metric export and logs a notice when AXIOM_METRICS_DATASET is not set', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'secret-token';
      process.env[ENV.AXIOM_DATASET] = 'my-dataset';
      const mod = await loadTracingModule();

      mod.startObservability();

      expect(otlpMetricExporterMock).not.toHaveBeenCalled();
      expect(periodicReaderMock).not.toHaveBeenCalled();
      const [config] = nodeSDKConstructorMock.mock.calls[0] as [{ metricReaders: unknown[] }];
      expect(config.metricReaders).toEqual([]);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('AXIOM_METRICS_DATASET not set'),
      );
    });

    it('configures the metrics exporter with its own dataset header when AXIOM_METRICS_DATASET is set', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'secret-token';
      process.env[ENV.AXIOM_DATASET] = 'my-dataset';
      process.env[ENV.AXIOM_METRICS_DATASET] = 'my-metrics-dataset';
      const mod = await loadTracingModule();

      mod.startObservability();

      expect(otlpMetricExporterMock).toHaveBeenCalledWith({
        url: `${AXIOM.API_URL}${AXIOM.METRICS_PATH}`,
        headers: {
          Authorization: 'Bearer secret-token',
          [AXIOM.METRICS_DATASET_HEADER]: 'my-metrics-dataset',
        },
      });
      const [config] = nodeSDKConstructorMock.mock.calls[0] as [{ metricReaders: unknown[] }];
      expect(config.metricReaders).toHaveLength(1);
    });

    it('includes the Fastify instrumentation instance in the instrumentations list', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'secret-token';
      process.env[ENV.AXIOM_DATASET] = 'my-dataset';
      const mod = await loadTracingModule();

      mod.startObservability();

      const [config] = nodeSDKConstructorMock.mock.calls[0] as [{ instrumentations: unknown[] }];
      expect(config.instrumentations).toContain(mod.fastifyOtelInstrumentation);
    });

    it('disables the noisy fs auto-instrumentation', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'secret-token';
      process.env[ENV.AXIOM_DATASET] = 'my-dataset';
      const mod = await loadTracingModule();

      mod.startObservability();

      expect(getNodeAutoInstrumentationsMock).toHaveBeenCalledWith({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      });
    });

    it('passes the BatchSpanProcessor via spanProcessors with a near-0 scheduled delay', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'secret-token';
      process.env[ENV.AXIOM_DATASET] = 'my-dataset';
      const mod = await loadTracingModule();

      mod.startObservability();

      const [sdkConfig] = nodeSDKConstructorMock.mock.calls[0] as [
        { spanProcessors: unknown[]; traceExporter?: unknown },
      ];
      expect(sdkConfig.traceExporter).toBeUndefined();
      expect(sdkConfig.spanProcessors).toHaveLength(1);
      const [processor] = batchSpanProcessorInstances;
      expect(processor.exporter).toBeInstanceOf(
        (await import('@opentelemetry/exporter-trace-otlp-proto')).OTLPTraceExporter,
      );
      expect(processor.config).toEqual({ scheduledDelayMillis: 0 });
    });
  });

  describe('flushObservability', () => {
    it('no-ops when the SDK has not started', async () => {
      const mod = await loadTracingModule();
      await expect(mod.flushObservability()).resolves.toBeUndefined();
      expect(nodeSDKStartMock).not.toHaveBeenCalled();
    });

    it('awaits forceFlush on the span processor and metric reader', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'secret-token';
      process.env[ENV.AXIOM_DATASET] = 'my-dataset';
      process.env[ENV.AXIOM_METRICS_DATASET] = 'my-metrics-dataset';
      const mod = await loadTracingModule();
      mod.startObservability();

      await mod.flushObservability();

      expect(batchSpanProcessorInstances[0].forceFlush).toHaveBeenCalledTimes(1);
      expect(metricReaderInstances[0].forceFlush).toHaveBeenCalledTimes(1);
    });

    it('only flushes the span processor when metrics are not configured', async () => {
      process.env[ENV.AXIOM_TOKEN] = 'secret-token';
      process.env[ENV.AXIOM_DATASET] = 'my-dataset';
      const mod = await loadTracingModule();
      mod.startObservability();

      await mod.flushObservability();

      expect(batchSpanProcessorInstances[0].forceFlush).toHaveBeenCalledTimes(1);
      expect(metricReaderInstances).toHaveLength(0);
    });
  });
});
