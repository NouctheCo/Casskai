import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useExperienceCompletion } from './useExperienceCompletion';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('useExperienceCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    const els = document.querySelectorAll('[data-result]');
    els.forEach((e) => e.remove());
  });

  it('loads completion status from Supabase when present', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { session_data: { featuresExploration: { guided_tour_completed: true, toastPreview: { displayed: false }, supabaseScenario: { status: 'pending' } } } },
        error: null,
      }),
    });

    function Test() {
      const { completionStatus } = useExperienceCompletion();
      return (
        <div>
          <span data-testid="g">{String(completionStatus.guidedTour)}</span>
          <span data-testid="t">{String(completionStatus.toastPreview)}</span>
          <span data-testid="s">{String(completionStatus.supabaseScenario)}</span>
        </div>
      );
    }

    render(<Test />);

    await waitFor(() => expect(screen.getByTestId('g').textContent).toBe('true'));
    expect(screen.getByTestId('t').textContent).toBe('false');
    expect(screen.getByTestId('s').textContent).toBe('false');
  });

  it('falls back to localStorage when Supabase not available', async () => {
    (supabase.auth.getSession as any).mockRejectedValue(new Error('no session'));

    localStorage.setItem('guided_tour_completed', 'true');
    localStorage.setItem('toast_preview_displayed', 'true');
    localStorage.setItem('supabase_scenario_completed', 'false');

    function Test() {
      const { completionStatus } = useExperienceCompletion();
      return (
        <div>
          <span data-testid="g">{String(completionStatus.guidedTour)}</span>
          <span data-testid="t">{String(completionStatus.toastPreview)}</span>
          <span data-testid="s">{String(completionStatus.supabaseScenario)}</span>
        </div>
      );
    }

    render(<Test />);

    await waitFor(() => expect(screen.getByTestId('g').textContent).toBe('true'));
    expect(screen.getByTestId('t').textContent).toBe('true');
    expect(screen.getByTestId('s').textContent).toBe('false');
  });

  it('syncCompletionWithSupabase returns success when RPC succeeds', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: { sessionId: 's1' }, error: null });

    function Test() {
      const { syncCompletionWithSupabase } = useExperienceCompletion();
      React.useEffect(() => {
        (async () => {
          const payload = { p_scenario: 'x', p_status: 'completed', p_payload: {} };
          const res = await syncCompletionWithSupabase(payload as any);
          // expose result in DOM
          const el = document.createElement('div');
          el.setAttribute('data-result', String(res.success));
          document.body.appendChild(el);
        })();
      }, [syncCompletionWithSupabase]);
      return null;
    }

    render(<Test />);

    await waitFor(() => expect(document.querySelector('[data-result]')?.getAttribute('data-result')).toBe('true'));
    expect((supabase.rpc as any)).toHaveBeenCalledWith('save_onboarding_scenario', { p_scenario: 'x', p_status: 'completed', p_payload: {} });
  });

  it('syncCompletionWithSupabase returns failure when RPC errors', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: null, error: { message: 'boom' } });

    function Test() {
      const { syncCompletionWithSupabase } = useExperienceCompletion();
      React.useEffect(() => {
        (async () => {
          const payload = { p_scenario: 'x', p_status: 'completed', p_payload: {} };
          const res = await syncCompletionWithSupabase(payload as any);
          const el = document.createElement('div');
          el.setAttribute('data-result', String(res.success));
          document.body.appendChild(el);
        })();
      }, [syncCompletionWithSupabase]);
      return null;
    }

    render(<Test />);

    await waitFor(() => expect(document.querySelector('[data-result]')?.getAttribute('data-result')).toBe('false'));
    expect((supabase.rpc as any)).toHaveBeenCalledWith('save_onboarding_scenario', { p_scenario: 'x', p_status: 'completed', p_payload: {} });
  });
});
