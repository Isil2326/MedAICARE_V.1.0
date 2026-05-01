import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from './authService';

const VALID_PASSWORD = 'StrongPass1';
const WEAK_NO_DIGIT = 'StrongPass';
const WEAK_NO_UPPER = 'strongpass1';
const WEAK_TOO_SHORT = 'Sp1';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('register', () => {
    it('rejects when required fields are missing', async () => {
      const r = await authService.register('', VALID_PASSWORD, 'A', 'patient');
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/requis/i);
    });

    it('rejects invalid email format', async () => {
      const r = await authService.register('notanemail', VALID_PASSWORD, 'A', 'patient');
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/email/i);
    });

    it('rejects passwords < 8 chars', async () => {
      const r = await authService.register('a@b.fr', WEAK_TOO_SHORT, 'A', 'patient');
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/8 caractères/);
    });

    it('rejects passwords without uppercase / lowercase / digit mix', async () => {
      const r1 = await authService.register('a@b.fr', WEAK_NO_DIGIT, 'A', 'patient');
      expect(r1.success).toBe(false);
      const r2 = await authService.register('a@b.fr', WEAK_NO_UPPER, 'A', 'patient');
      expect(r2.success).toBe(false);
    });

    it('rejects clinician registration without specialty', async () => {
      const r = await authService.register('doc@b.fr', VALID_PASSWORD, 'Doc', 'clinician');
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/RPPS|spécialité/i);
    });

    it('creates a patient user, persists session, never leaks credentials', async () => {
      const r = await authService.register('alice@x.fr', VALID_PASSWORD, 'Alice', 'patient');
      expect(r.success).toBe(true);
      expect(r.user).toBeDefined();
      expect(r.user?.email).toBe('alice@x.fr');
      expect(r.user?.role).toBe('patient');
      expect((r.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
      expect((r.user as unknown as Record<string, unknown>).salt).toBeUndefined();
      expect(authService.getCurrentUser()?.email).toBe('alice@x.fr');
    });

    it('rejects duplicate emails (case-insensitive)', async () => {
      await authService.register('bob@x.fr', VALID_PASSWORD, 'Bob', 'patient');
      const r = await authService.register('BOB@x.fr', VALID_PASSWORD, 'Bob2', 'patient');
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/déjà utilisé/i);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register('eve@x.fr', VALID_PASSWORD, 'Eve', 'patient');
      authService.logout();
    });

    it('logs in with correct credentials and returns a session', async () => {
      const r = await authService.login('eve@x.fr', VALID_PASSWORD);
      expect(r.success).toBe(true);
      expect(r.session?.token).toBeTruthy();
      expect(r.session?.expiresAt).toBeGreaterThan(Date.now());
    });

    it('is case-insensitive on the email', async () => {
      const r = await authService.login('EVE@x.fr', VALID_PASSWORD);
      expect(r.success).toBe(true);
    });

    it('rejects unknown emails with a generic error', async () => {
      const r = await authService.login('ghost@x.fr', VALID_PASSWORD);
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/invalides/i);
    }, 10000);

    it('rejects wrong password with a generic error', async () => {
      const r = await authService.login('eve@x.fr', 'WrongPass1');
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/invalides/i);
    }, 10000);
  });

  describe('session management', () => {
    it('logout clears the current session', async () => {
      await authService.register('zoe@x.fr', VALID_PASSWORD, 'Zoe', 'patient');
      expect(authService.getCurrentUser()).not.toBeNull();
      authService.logout();
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getCurrentSession()).toBeNull();
    });
  });

  describe('canAccess (RBAC)', () => {
    it('grants patient role access to patient + devices views only', () => {
      expect(authService.canAccess('patient', 'patient')).toBe(true);
      expect(authService.canAccess('patient', 'devices')).toBe(true);
      expect(authService.canAccess('patient', 'doctor')).toBe(false);
      expect(authService.canAccess('patient', 'audit')).toBe(false);
    });

    it('grants clinician role access to doctor + devices + audit, never patient view', () => {
      expect(authService.canAccess('clinician', 'doctor')).toBe(true);
      expect(authService.canAccess('clinician', 'devices')).toBe(true);
      expect(authService.canAccess('clinician', 'audit')).toBe(true);
      expect(authService.canAccess('clinician', 'patient')).toBe(false);
    });

    it('returns false for unknown views', () => {
      expect(authService.canAccess('patient', 'unknown')).toBe(false);
      expect(authService.canAccess('clinician', 'admin')).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('returns users without sensitive credentials', async () => {
      await authService.register('a@x.fr', VALID_PASSWORD, 'A', 'patient');
      await authService.register('b@x.fr', VALID_PASSWORD, 'B', 'patient');
      const users = authService.getAllUsers();
      expect(users.length).toBeGreaterThanOrEqual(2);
      for (const u of users) {
        expect((u as Record<string, unknown>).passwordHash).toBeUndefined();
        expect((u as Record<string, unknown>).salt).toBeUndefined();
      }
    });
  });
});
