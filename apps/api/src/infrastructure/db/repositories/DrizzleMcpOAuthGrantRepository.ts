import { and, eq, gt, isNull, max } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import {
  mcpOAuthAccessToken,
  mcpOAuthAuthorizationCode,
  mcpOAuthClient,
  mcpOAuthRefreshToken,
} from '../schema.js';
import { getClient } from '../transactionContext.js';
import type { McpOAuthGrant } from '#src/domain/mcpOAuth/McpOAuthGrant.js';
import type { McpOAuthScope } from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';
import type { IMcpOAuthGrantRepository } from '#src/use-cases/ports/IMcpOAuthGrantRepository.js';

export class DrizzleMcpOAuthGrantRepository implements IMcpOAuthGrantRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async findActiveByUserId(userId: string, now: Date): Promise<McpOAuthGrant[]> {
    // The authorization code is the record of the consent itself: exactly one
    // row per grant, written when the user approved, carrying what they
    // approved. Refresh tokens would say the same thing but multiply with every
    // rotation, so they are only asked the question they alone can answer —
    // is this grant still live.
    const consents = await this.db
      .select({
        id: mcpOAuthAuthorizationCode.familyId,
        clientId: mcpOAuthAuthorizationCode.clientId,
        clientName: mcpOAuthClient.name,
        scope: mcpOAuthAuthorizationCode.scope,
        authorizedAt: mcpOAuthAuthorizationCode.createdAt,
      })
      .from(mcpOAuthAuthorizationCode)
      .innerJoin(mcpOAuthClient, eq(mcpOAuthClient.id, mcpOAuthAuthorizationCode.clientId))
      .where(eq(mcpOAuthAuthorizationCode.userId, userId));
    if (consents.length === 0) return [];

    const live = await this.db
      .select({ id: mcpOAuthRefreshToken.familyId })
      .from(mcpOAuthRefreshToken)
      .where(
        and(
          eq(mcpOAuthRefreshToken.userId, userId),
          isNull(mcpOAuthRefreshToken.revokedAt),
          gt(mcpOAuthRefreshToken.expiresAt, now),
        ),
      )
      .groupBy(mcpOAuthRefreshToken.familyId);
    const liveIds = new Set(live.map((row) => row.id));

    // Aggregated rather than fetched: access tokens accumulate one row per
    // refresh, and only the most recent use is of interest.
    const used = await this.db
      .select({ id: mcpOAuthAccessToken.familyId, lastUsedAt: max(mcpOAuthAccessToken.lastUsedAt) })
      .from(mcpOAuthAccessToken)
      .where(eq(mcpOAuthAccessToken.userId, userId))
      .groupBy(mcpOAuthAccessToken.familyId);
    const lastUsed = new Map(used.map((row) => [row.id, row.lastUsedAt]));

    return consents
      .filter((consent) => liveIds.has(consent.id))
      .map((consent) => ({
        id: consent.id,
        userId,
        clientId: consent.clientId,
        clientName: consent.clientName,
        scope: consent.scope as McpOAuthScope,
        authorizedAt: consent.authorizedAt,
        lastUsedAt: lastUsed.get(consent.id) ?? null,
      }))
      .sort((a, b) => b.authorizedAt.getTime() - a.authorizedAt.getTime());
  }
}
