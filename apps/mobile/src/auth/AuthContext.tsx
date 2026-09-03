import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getTokens, setTokens, clearTokens, type TokenPair } from './tokenStorage';
import { gqlRequest, setAccessToken, onSessionExpired } from '../graphql/client';

const REGISTER_MOBILE_MUTATION = `
  mutation RegisterMobile($email: String!, $password: String!) {
    registerMobile(email: $email, password: $password) {
      accessToken
      refreshToken
    }
  }
`;

const LOGIN_MOBILE_MUTATION = `
  mutation LoginMobile($email: String!, $password: String!) {
    loginMobile(email: $email, password: $password) {
      success
      totpRequired
      accessToken
      refreshToken
    }
  }
`;

const LOGIN_WITH_TOTP_MOBILE_MUTATION = `
  mutation LoginWithTotpMobile($email: String!, $password: String!, $code: String!) {
    loginWithTotpMobile(email: $email, password: $password, code: $code) {
      accessToken
      refreshToken
    }
  }
`;

const LOGOUT_MUTATION = `mutation Logout { logout }`;

interface LoginMobileResult {
  success: boolean;
  totpRequired: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface LoginOutcome {
  totpRequired: boolean;
}

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  loginWithTotp: (email: string, password: string, code: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    return onSessionExpired(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = await getTokens();
      if (cancelled) return;
      if (tokens) {
        setAccessToken(tokens.accessToken);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyTokens = useCallback(async (tokens: TokenPair) => {
    await setTokens(tokens);
    setAccessToken(tokens.accessToken);
    setIsAuthenticated(true);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginOutcome> => {
      const data = await gqlRequest<{ loginMobile: LoginMobileResult }>(LOGIN_MOBILE_MUTATION, {
        email,
        password,
      });
      const result = data.loginMobile;
      if (result.totpRequired || !result.accessToken || !result.refreshToken) {
        return { totpRequired: result.totpRequired };
      }
      await applyTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      return { totpRequired: false };
    },
    [applyTokens],
  );

  const loginWithTotp = useCallback(
    async (email: string, password: string, code: string): Promise<void> => {
      const data = await gqlRequest<{ loginWithTotpMobile: TokenPair }>(
        LOGIN_WITH_TOTP_MOBILE_MUTATION,
        { email, password, code },
      );
      await applyTokens(data.loginWithTotpMobile);
    },
    [applyTokens],
  );

  const register = useCallback(
    async (email: string, password: string): Promise<void> => {
      const data = await gqlRequest<{ registerMobile: TokenPair }>(REGISTER_MOBILE_MUTATION, {
        email,
        password,
      });
      await applyTokens(data.registerMobile);
    },
    [applyTokens],
  );

  const logout = useCallback(async (): Promise<void> => {
    await gqlRequest(LOGOUT_MUTATION).catch(() => {
      // Best-effort — an already-expired/missing session shouldn't block logout.
    });
    await clearTokens();
    setAccessToken(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isLoading, isAuthenticated, login, loginWithTotp, register, logout }),
    [isLoading, isAuthenticated, login, loginWithTotp, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
