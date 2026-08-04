import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OAuthButtons } from '#/components/OAuthButtons';

describe('OAuthButtons', () => {
  it('renders the "or" divider', () => {
    render(<OAuthButtons label="Sign up" />);
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('renders Google OAuth link with the label', () => {
    render(<OAuthButtons label="Sign up" />);
    const link = screen.getByRole('link', { name: /sign up with google/i });
    expect(link).toHaveAttribute('href', '/auth/oauth/google/start');
  });

  it('renders GitHub OAuth link with the label', () => {
    render(<OAuthButtons label="Log in" />);
    const link = screen.getByRole('link', { name: /log in with github/i });
    expect(link).toHaveAttribute('href', '/auth/oauth/github/start');
  });

  it('renders both OAuth buttons', () => {
    render(<OAuthButtons label="Continue" />);
    expect(screen.getByRole('link', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue with github/i })).toBeInTheDocument();
  });
});
