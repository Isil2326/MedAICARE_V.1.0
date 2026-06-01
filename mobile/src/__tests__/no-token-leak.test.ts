/**
 * Garde-fou statique des non-négociables Phase 6 :
 * - AUCUN code source n'importe AsyncStorage (jetons interdits hors SecureStore).
 * - AUCUN code ne journalise un jeton (pas de console.log de *token).
 * - localStorage n'est jamais utilisé pour écrire un jeton.
 */
import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(SRC);

test('aucune importation d’AsyncStorage dans le code source', () => {
  const offenders = files.filter((f) => {
    const src = fs.readFileSync(f, 'utf8');
    return /from\s+['"]@react-native-async-storage\/async-storage['"]/.test(src);
  });
  expect(offenders).toEqual([]);
});

test('aucune écriture de jeton dans localStorage', () => {
  const offenders = files.filter((f) => {
    const src = fs.readFileSync(f, 'utf8');
    return /localStorage\.(setItem|getItem)\s*\(\s*['"][^'"]*token/i.test(src);
  });
  expect(offenders).toEqual([]);
});

test('aucun jeton n’est journalisé (console.* token)', () => {
  const offenders = files.filter((f) => {
    const src = fs.readFileSync(f, 'utf8');
    return /console\.\w+\([^)]*(access_token|refresh_token|accessToken|refreshToken|Bearer\s)/.test(
      src,
    );
  });
  expect(offenders).toEqual([]);
});
