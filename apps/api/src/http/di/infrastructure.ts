import { nanoid } from 'nanoid';
import { asClass, asValue, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { db } from '#src/infrastructure/db/client.js';

import { Redis } from '@upstash/redis';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { RedisCache } from '#src/infrastructure/cache/RedisCache.js';
import { LocalStorageProvider } from '#src/infrastructure/storage/LocalStorageProvider.js';
import { VercelBlobStorageProvider } from '#src/infrastructure/storage/VercelBlobStorageProvider.js';
import { JwtTokenService } from '#src/infrastructure/auth/JwtTokenService.js';
import { TotpProvider } from '#src/infrastructure/auth/TotpProvider.js';
import { GoogleOAuthProvider } from '#src/infrastructure/auth/GoogleOAuthProvider.js';
import { GitHubOAuthProvider } from '#src/infrastructure/auth/GitHubOAuthProvider.js';
import { OAuthProviderRegistry } from '#src/infrastructure/auth/OAuthProviderRegistry.js';
import { OAuthStateService } from '#src/infrastructure/auth/OAuthStateService.js';
import { BrevoEmailService } from '#src/infrastructure/email/BrevoEmailService.js';
import { DeviceLabelService } from '#src/infrastructure/device/DeviceLabelService.js';
import { IpLocationService } from '#src/infrastructure/device/IpLocationService.js';
import { WebPushService } from '#src/infrastructure/push/WebPushService.js';
import { DrizzleTransactionManager } from '#src/infrastructure/db/DrizzleTransactionManager.js';
import { LlmApiKeyCipher } from '#src/infrastructure/llm/LlmApiKeyCipher.js';
import { UserLLMProviderFactory } from '#src/infrastructure/llm/UserLLMProviderFactory.js';
import { DocumentTextExtractor } from '#src/infrastructure/documents/DocumentTextExtractor.js';
import { ReactPdfDocumentRenderer } from '#src/infrastructure/pdf/ReactPdfDocumentRenderer.js';
import { FetchJobPostingSourceResolver } from '#src/infrastructure/jobDescription/FetchJobPostingSourceResolver.js';

import { CACHE_PROVIDER, ENV, STORAGE_PROVIDER } from '#src/constants.js';
import type { Cradle } from './types.js';

type StorageProviderConstructor = new () => LocalStorageProvider | VercelBlobStorageProvider;
const StorageProvider: StorageProviderConstructor =
  process.env[ENV.STORAGE_PROVIDER] === STORAGE_PROVIDER.VERCEL_BLOB
    ? VercelBlobStorageProvider
    : LocalStorageProvider;

/**
 * Unlike storage (only document upload/download depend on it), the cache
 * underlies nearly every read in the app — a misconfigured Redis provider
 * would silently 500 almost every request. So this validates eagerly at
 * container-build time instead of lazily on first use.
 */
function buildCache(): ICache {
  if (process.env[ENV.CACHE_PROVIDER] !== CACHE_PROVIDER.REDIS) {
    return new MemoryCache();
  }

  const url = process.env[ENV.UPSTASH_REDIS_REST_URL];
  const token = process.env[ENV.UPSTASH_REDIS_REST_TOKEN];
  if (!url || !token) {
    throw new Error(
      `${ENV.CACHE_PROVIDER}=${CACHE_PROVIDER.REDIS} requires both ${ENV.UPSTASH_REDIS_REST_URL} and ${ENV.UPSTASH_REDIS_REST_TOKEN}`,
    );
  }
  return new RedisCache({ redis: new Redis({ url, token }) });
}

export const infrastructure = {
  db: asValue(db),
  storageProvider: asClass(StorageProvider, { lifetime: Lifetime.SINGLETON }),
  generateId: asValue(() => nanoid()),
  webAppOrigin: asValue(
    process.env[ENV.CORS_ORIGIN]?.split(',')[0]?.trim() ?? 'http://localhost:3000',
  ),
  tokenService: asClass(JwtTokenService, { lifetime: Lifetime.SINGLETON }),
  cache: asValue(buildCache()),
  transactionManager: asClass(DrizzleTransactionManager, { lifetime: Lifetime.SINGLETON }),
  totpProvider: asClass(TotpProvider, { lifetime: Lifetime.SINGLETON }),
  googleOAuthProvider: asClass(GoogleOAuthProvider, { lifetime: Lifetime.SINGLETON }),
  gitHubOAuthProvider: asClass(GitHubOAuthProvider, { lifetime: Lifetime.SINGLETON }),
  oauthProviderRegistry: asClass(OAuthProviderRegistry, { lifetime: Lifetime.SINGLETON }),
  oauthStateService: asClass(OAuthStateService, { lifetime: Lifetime.SINGLETON }),
  emailService: asClass(BrevoEmailService, { lifetime: Lifetime.SINGLETON }),
  deviceLabeler: asClass(DeviceLabelService, { lifetime: Lifetime.SINGLETON }),
  ipLocationResolver: asClass(IpLocationService, { lifetime: Lifetime.SINGLETON }),
  webPushService: asClass(WebPushService, { lifetime: Lifetime.SINGLETON }),
  llmApiKeyCipher: asClass(LlmApiKeyCipher, { lifetime: Lifetime.SINGLETON }),
  llmProviderFactory: asClass(UserLLMProviderFactory, { lifetime: Lifetime.SINGLETON }),
  documentTextExtractor: asClass(DocumentTextExtractor, { lifetime: Lifetime.SINGLETON }),
  pdfRenderer: asClass(ReactPdfDocumentRenderer, { lifetime: Lifetime.SINGLETON }),
  jobPostingSourceResolver: asClass(FetchJobPostingSourceResolver, {
    lifetime: Lifetime.SINGLETON,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
