import { parse } from '@formatjs/icu-messageformat-parser';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_LOCALES, defaultLocale, locales } from '@/i18n/config';

type MessageTree = Record<string, unknown>;

function loadMessages(locale: string): MessageTree {
  const file = path.join(process.cwd(), 'messages', `${locale}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8')) as MessageTree;
}

function flattenMessages(value: unknown, prefix = '', out: Record<string, unknown> = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flattenMessages(child, prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
  }
  out[prefix] = value;
  return out;
}

function collectPlaceholders(message: string): string[] {
  const names = new Set<string>();
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const record = node as { type?: number; value?: unknown; options?: Record<string, { value?: unknown[] }> };
    if (record.type && record.type >= 1 && record.type <= 6 && typeof record.value === 'string') {
      names.add(record.value);
    }
    for (const option of Object.values(record.options ?? {})) {
      for (const child of option.value ?? []) visit(child);
    }
  };
  for (const node of parse(message, { ignoreTag: true })) visit(node);
  return [...names].sort();
}

describe('i18n messages', () => {
  const english = flattenMessages(loadMessages(defaultLocale));
  const baseKeys = Object.keys(english).sort();

  it('has a message file for every enabled locale', () => {
    expect(locales).toEqual(['en', 'ta', 'hi']);
    for (const locale of locales) {
      expect(fs.existsSync(path.join(process.cwd(), 'messages', `${locale}.json`))).toBe(true);
    }
  });

  it('keeps every enabled locale structurally aligned with English', () => {
    for (const locale of locales) {
      const current = flattenMessages(loadMessages(locale));
      expect(Object.keys(current).sort()).toEqual(baseKeys);
    }
  });

  it('does not ship empty message values', () => {
    for (const locale of locales) {
      const current = flattenMessages(loadMessages(locale));
      const empty = Object.entries(current)
        .filter(([, value]) => value === '' || value === null)
        .map(([key]) => key);
      expect(empty).toEqual([]);
    }
  });

  it('keeps interpolation placeholders consistent with English', () => {
    for (const locale of locales.filter((locale) => locale !== defaultLocale)) {
      const current = flattenMessages(loadMessages(locale));
      const mismatched = baseKeys.filter((key) => {
        const baseValue = english[key];
        const localeValue = current[key];
        if (typeof baseValue !== 'string' || typeof localeValue !== 'string') return false;
        return collectPlaceholders(baseValue).join('|') !== collectPlaceholders(localeValue).join('|');
      });
      expect(mismatched).toEqual([]);
    }
  });

  it('has a safe default locale within the known locale set', () => {
    expect(ALL_LOCALES).toContain(defaultLocale);
    expect(locales).toContain(defaultLocale);
  });
});
