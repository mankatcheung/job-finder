import type { Session } from '#src/domain/session/Session.js';
import type {
  ISessionRepository,
  CreateSessionData,
  RotateRefreshTokenData,
} from '#src/use-cases/ports/ISessionRepository.js';
import type { ISessionBlocklist } from '#src/use-cases/ports/ISessionBlocklist.js';

interface Deps {
  drizzleSessionRepository: ISessionRepository;
  sessionBlocklist: ISessionBlocklist;
}

/**
 * Decorates the session repository so that **every** DB revocation also
 * blocklists the affected session ids (JEF-164), following the same
 * decorator convention as the `Cached*Repository` family.
 *
 * Centralising it here rather than at each call site is what makes this
 * complete: there are four distinct revocation paths, and each one gained
 * immediate-revocation semantics for free —
 *   - `RevokeSessionUseCase` (logout, and revoking one listed device)
 *   - `RevokeOtherSessionsUseCase` ("sign out other sessions")
 *   - `ResetPasswordUseCase` (revokes every session after a reset)
 *   - `RotateRefreshTokenUseCase` (refresh-token reuse detected)
 * — with no way for a future fifth caller to forget the blocklist write,
 * since it can only reach the DB through this decorator.
 *
 * The DB write stays the source of truth and always happens first; the
 * blocklist is a best-effort accelerator layered on top (its implementations
 * fail open and never throw), so a blocklist outage degrades to the old
 * "revocation applies at next refresh" behaviour rather than failing the
 * revocation itself.
 */
export class BlocklistingSessionRepository implements ISessionRepository {
  private readonly inner: ISessionRepository;
  private readonly blocklist: ISessionBlocklist;

  constructor({ drizzleSessionRepository, sessionBlocklist }: Deps) {
    this.inner = drizzleSessionRepository;
    this.blocklist = sessionBlocklist;
  }

  async revoke(id: string): Promise<void> {
    await this.inner.revoke(id);
    await this.blocklist.revoke(id);
  }

  async revokeAllForUserExcept(userId: string, exceptId: string): Promise<void> {
    // Read the ids first: once the DB revocation lands these are no longer
    // "active", so there'd be nothing left to enumerate.
    const affected = await this.inner.findActiveByUserId(userId);
    await this.inner.revokeAllForUserExcept(userId, exceptId);
    await Promise.all(
      affected.filter((s) => s.id !== exceptId).map((s) => this.blocklist.revoke(s.id)),
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const affected = await this.inner.findActiveByUserId(userId);
    await this.inner.revokeAllForUser(userId);
    await Promise.all(affected.map((s) => this.blocklist.revoke(s.id)));
  }

  // ── Pass-through: nothing below revokes a session ──
  create(data: CreateSessionData): Promise<Session> {
    return this.inner.create(data);
  }

  findById(id: string): Promise<Session | null> {
    return this.inner.findById(id);
  }

  findByIdAndUserId(id: string, userId: string): Promise<Session | null> {
    return this.inner.findByIdAndUserId(id, userId);
  }

  findActiveByUserId(userId: string): Promise<Session[]> {
    return this.inner.findActiveByUserId(userId);
  }

  touch(id: string, expiresAt: Date): Promise<void> {
    return this.inner.touch(id, expiresAt);
  }

  rotateRefreshToken(id: string, data: RotateRefreshTokenData): Promise<void> {
    return this.inner.rotateRefreshToken(id, data);
  }

  findDistinctUserAgentsByUserId(userId: string): Promise<string[]> {
    return this.inner.findDistinctUserAgentsByUserId(userId);
  }
}
