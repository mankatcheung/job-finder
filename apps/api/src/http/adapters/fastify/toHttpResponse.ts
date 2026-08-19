import type { FastifyReply } from 'fastify';
import type { IHttpResponse, CookieOptions } from '#src/http/ports/IHttpResponse.js';

export function toHttpResponse(reply: FastifyReply): IHttpResponse {
  const wrapper: IHttpResponse = {
    status(code) {
      reply.status(code);
      return wrapper;
    },
    header(name, value) {
      reply.header(name, value);
      return wrapper;
    },
    send(body) {
      reply.send(body);
    },
    redirect(url) {
      reply.redirect(url);
    },
    setCookie(name, value, options) {
      reply.setCookie(name, value, options as CookieOptions);
    },
    clearCookie(name, options) {
      reply.clearCookie(name, options);
    },
  };
  return wrapper;
}
