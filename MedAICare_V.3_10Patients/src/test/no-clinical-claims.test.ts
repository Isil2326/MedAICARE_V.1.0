// ============================================================================
// GARDE-FOU CONTENU WEB — aucune fausse revendication clinique / de certification
// ----------------------------------------------------------------------------
// Le portail web (et la démo legacy encore accessible) NE DOIVENT PAS prétendre
// à une validation clinique, une certification ou un usage médical réel.
// Ce test échoue si un terme interdit réapparaît dans le code source UI.
// (Phase 8.5.1 — recadrage web institutionnel.)
// ============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '..');
const DIST_INDEX = path.resolve(__dirname, '../../dist/index.html');

// Motifs interdits (insensibles à la casse). On vise des AFFIRMATIONS de
// validation/certification, pas les mentions de NON-certification ni les
// références « cible » documentées.
const FORBIDDEN: { label: string; re: RegExp }[] = [
  { label: 'validé(e)(s) cliniquement', re: /valid[ée]e?s?\s+cliniquement/i },
  { label: 'validé par un comité clinique', re: /valid[ée]\s+par\s+un\s+comit[ée]\s+clinique/i },
  { label: 'validé MD', re: /valid[ée]\s+md\b/i },
  { label: 'cliniquement prouvé', re: /cliniquement\s+prouv[ée]/i },
  { label: 'dispositif médical certifié', re: /dispositif\s+m[ée]dical\s+certifi[ée]/i },
  { label: 'certifié CE / FDA', re: /(certifi[ée]\s+(ce|fda))|(marquage\s+ce\s+obtenu)/i },
];

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'test') continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectFiles(full));
    else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('Garde-fou contenu web — pas de fausse revendication clinique', () => {
  const files = collectFiles(SRC);

  it('le code source UI ne contient aucun terme de validation/certification clinique', () => {
    const violations: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const { label, re } of FORBIDDEN) {
        if (re.test(text)) {
          violations.push(`${path.relative(SRC, file)} → « ${label} »`);
        }
      }
    }
    expect(violations, `Revendications interdites détectées:\n${violations.join('\n')}`).toEqual([]);
  });

  // L'app web est déployée en site statique mono-fichier (vite singlefile → dist/index.html).
  // Si un build existe, il NE doit pas non plus contenir de revendication interdite
  // (garde contre un dist/ obsolète redéployé après correction des sources).
  it.skipIf(!existsSync(DIST_INDEX))(
    "le build statique (dist/index.html) ne contient aucune revendication interdite",
    () => {
      const text = readFileSync(DIST_INDEX, 'utf8');
      const violations = FORBIDDEN.filter(({ re }) => re.test(text)).map(({ label }) => label);
      expect(
        violations,
        `dist/index.html obsolète — reconstruire (npm run build). Revendications: ${violations.join(', ')}`,
      ).toEqual([]);
    },
  );
});
