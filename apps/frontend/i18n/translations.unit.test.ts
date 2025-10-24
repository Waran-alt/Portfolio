import fs from 'node:fs';
import path from 'node:path';

/**
 * @file Purpose: Guardrail test ensuring i18n key parity between locales.
 *
 * Why: It's easy to add a key (e.g., in `en/svgTest.json`) and forget
 * to add the same key in another locale (e.g., `fr/svgTest.json`).
 * This test fails when the flattened key sets differ so we catch
 * missing translations in CI rather than at runtime.
 */

/** Read and parse a JSON file from disk. */
function readJson(filePath: string): unknown {
	const content = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(content);
}

/**
 * Flatten a nested JSON object into dot-notated keys.
 * Example: { a: { b: { c: "x" } } } -> ["a.b.c"]
 */
function flattenKeys(obj: unknown, prefix = ''): Set<string> {
	const keys = new Set<string>();
	if (obj && typeof obj === 'object') {
		for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
			const p = prefix ? `${prefix}.${k}` : k;
			if (v && typeof v === 'object') {
				for (const fk of flattenKeys(v, p)) keys.add(fk);
			} else {
				keys.add(p);
			}
		}
	}
	return keys;
}

describe('i18n translation parity', () => {
    // Location of all locale JSON files
    const localesDir = path.resolve(__dirname, '../public/locales');
    // Namespaces we enforce parity for; add new namespaces here
    const namespaces = ['common', 'svgTest'] as const;
    // Locales to compare; extend as more locales are added
    const locales = ['en', 'fr'] as const;
    type Locale = typeof locales[number];

    namespaces.forEach(ns => {
		it(`should have the same keys for namespace "${ns}" across locales`, () => {
			const localeFiles: Record<Locale, string> = {
				en: path.join(localesDir, 'en', `${ns}.json`),
				fr: path.join(localesDir, 'fr', `${ns}.json`),
			};

			for (const l of locales) {
				expect(fs.existsSync(localeFiles[l])).toBe(true);
			}

			const maps: Record<Locale, Set<string>> = {
				en: flattenKeys(readJson(localeFiles.en)),
				fr: flattenKeys(readJson(localeFiles.fr)),
			};

            const [l1, l2] = locales;
			const onlyInL1 = [...maps[l1]].filter(k => !maps[l2].has(k));
			const onlyInL2 = [...maps[l2]].filter(k => !maps[l1].has(k));

			const details = [
				onlyInL1.length ? `Missing in ${l2}: ${onlyInL1.join(', ')}` : '',
				onlyInL2.length ? `Missing in ${l1}: ${onlyInL2.join(', ')}` : '',
			].filter(Boolean).join('\n');

            // If there are differences, include a readable diff in a thrown error
            if (onlyInL1.length || onlyInL2.length) {
                throw new Error(details || 'Translation keys mismatch');
            }
		});
	});
});
