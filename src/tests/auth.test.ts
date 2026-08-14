// Role redirection helper to test
export function getRedirectPath(role: string): string {
  if (role === 'admin') return '/dashboard/admin';
  if (['lawyer', 'professor', 'doctorate'].includes(role)) return '/dashboard/lawyer';
  if (['user', 'student'].includes(role)) return '/dashboard/user';
  return '/dashboard/user';
}

// Demo accounts database verification structure
export interface DemoAccount {
  name: string;
  email: string;
  pass: string;
  role: string;
  expectedDashboard: string;
}

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  citizen: {
    name: 'Citoyen / Particulier',
    email: 'just@gmail.com',
    pass: 'Just1@',
    role: 'user',
    expectedDashboard: '/dashboard/user'
  },
  student: {
    name: 'Étudiant en Droit',
    email: 'etudjust@gmail.com',
    pass: 'Etudjust1@',
    role: 'student',
    expectedDashboard: '/dashboard/user'
  },
  professor: {
    name: 'Professeur de Droit',
    email: 'profjust@gmail.com',
    pass: 'Profjust1@',
    role: 'professor',
    expectedDashboard: '/dashboard/lawyer'
  },
  doctorate: {
    name: 'Doctorant / Chercheur',
    email: 'doctjust@gmail.com',
    pass: 'Doctjust1@',
    role: 'doctorate',
    expectedDashboard: '/dashboard/lawyer'
  },
  lawyer: {
    name: 'Avocat au Barreau',
    email: 'avocat@gmail.com',
    pass: 'Avocat123!',
    role: 'lawyer',
    expectedDashboard: '/dashboard/lawyer'
  },
  admin: {
    name: 'Administrateur Général',
    email: 'justlaw@gmail.com',
    pass: 'Just1@',
    role: 'admin',
    expectedDashboard: '/dashboard/admin'
  }
};

export function runAllAuthTests(): { passed: number; total: number; details: string[] } {
  const details: string[] = [];
  let passed = 0;
  const accounts = Object.values(DEMO_ACCOUNTS);

  for (const acc of accounts) {
    const redirect = getRedirectPath(acc.role);
    if (redirect === acc.expectedDashboard) {
      passed++;
      details.push(`✅ [PASS] ${acc.name} (${acc.email}) -> Role: '${acc.role}', Redirection: '${redirect}' OK`);
    } else {
      details.push(`❌ [FAIL] ${acc.name} (${acc.email}) -> Attendu: '${acc.expectedDashboard}', Obtenu: '${redirect}'`);
    }
  }

  return { passed, total: accounts.length, details };
}

import { describe, it, expect } from 'vitest';

describe('Auth & Role Redirections', () => {
  it('correctly maps roles to expected dashboard paths', () => {
    const res = runAllAuthTests();
    expect(res.passed).toBe(res.total);
  });
});
