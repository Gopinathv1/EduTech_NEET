import { describe, expect, it } from 'vitest';
import {
  isActiveTestPath,
  logoutRedirectFor,
  shouldShowFloatingSupport,
  shouldShowLogout,
  shouldUseBrowserBack,
} from '@/lib/navigation/global-controls';

describe('global navigation policy', () => {
  it('identifies only the actual active-attempt route', () => {
    expect(isActiveTestPath('/student/tests/neet-1/attempt')).toBe(true);
    expect(isActiveTestPath('/student/tests/neet-1/start')).toBe(false);
    expect(isActiveTestPath('/student/tests/neet-1')).toBe(false);
    expect(isActiveTestPath('/student/results/attempt-1')).toBe(false);
  });

  it('suppresses both floating support controls only during an active test', () => {
    expect(shouldShowFloatingSupport('/student/tests/neet-1/attempt')).toBe(false);
    expect(shouldShowFloatingSupport('/')).toBe(true);
    expect(shouldShowFloatingSupport('/student')).toBe(true);
    expect(shouldShowFloatingSupport('/admin')).toBe(true);
    expect(shouldShowFloatingSupport('/partner')).toBe(true);
  });

  it('shows logout only for authenticated sessions', () => {
    expect(shouldShowLogout(null)).toBe(false);
    expect(shouldShowLogout('student')).toBe(true);
    expect(shouldShowLogout('admin')).toBe(true);
    expect(shouldShowLogout('partner')).toBe(true);
  });

  it('preserves role-specific safe destinations after the shared logout', () => {
    expect(logoutRedirectFor('student')).toBe('/');
    expect(logoutRedirectFor('admin')).toBe('/admin/login');
    expect(logoutRedirectFor('partner')).toBe('/partner/login');
  });

  it('uses one-entry browser back only for meaningful internal history', () => {
    expect(shouldUseBrowserBack({
      hasObservedInternalNavigation: true,
      referrer: '',
      currentOrigin: 'https://www.sivora-uprising.com',
    })).toBe(true);
    expect(shouldUseBrowserBack({
      hasObservedInternalNavigation: false,
      referrer: 'https://www.sivora-uprising.com/admissions',
      currentOrigin: 'https://www.sivora-uprising.com',
    })).toBe(true);
    expect(shouldUseBrowserBack({
      hasObservedInternalNavigation: false,
      referrer: 'https://example.com/',
      currentOrigin: 'https://www.sivora-uprising.com',
    })).toBe(false);
  });
});
