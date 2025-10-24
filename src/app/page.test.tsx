import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils';
import Home from './page';

describe('Home Page', () => {
  it('renders the welcome message', () => {
    render(<Home />);
    expect(screen.getByText(/Welcome to heXcms/i)).toBeInTheDocument();
  });

  it('displays the tagline', () => {
    render(<Home />);
    expect(
      screen.getByText(/A Git-based Headless CMS with database sync/i)
    ).toBeInTheDocument();
  });

  it('shows the three main features', () => {
    render(<Home />);
    expect(screen.getByText(/Fast Builds/i)).toBeInTheDocument();
    expect(screen.getByText(/Git-Based/i)).toBeInTheDocument();
    expect(screen.getByText(/Database Powered/i)).toBeInTheDocument();
  });

  it('displays phase 1 initialization message', () => {
    render(<Home />);
    expect(screen.getByText(/Phase 1 initialized/i)).toBeInTheDocument();
  });
});
