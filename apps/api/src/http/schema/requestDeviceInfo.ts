import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';
import type { DeviceInfo } from '#src/interface-adapters/resolvers/AuthResolver.js';

/** Extracts the caller's IP/user-agent from a request, for login/security-event logging. */
export function deviceInfoFrom(request: IHttpRequest): DeviceInfo {
  const userAgent = request.headers['user-agent'];
  return {
    userAgent: typeof userAgent === 'string' ? userAgent : null,
    ipAddress: request.ip,
  };
}
