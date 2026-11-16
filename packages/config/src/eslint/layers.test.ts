import { describe, expect, it } from 'vitest';
import { getRestrictedImportPatterns, type Layer } from './layers.js';

function restrictedGroups(layer: Layer): string[] {
  return getRestrictedImportPatterns(layer).flatMap((pattern) => [...pattern.group]);
}

describe('getRestrictedImportPatterns', () => {
  it('forbids deep imports into other packages in every layer', () => {
    expect(restrictedGroups('domain')).toContain('@hf/*/*');
    expect(restrictedGroups('web')).toContain('@hf/*/*');
  });

  it('keeps the domain free of libraries and other packages', () => {
    expect(restrictedGroups('domain')).toEqual(expect.arrayContaining(['@hf/*', 'zod', 'hono']));
  });

  it('keeps the web away from the database and business logic', () => {
    expect(restrictedGroups('web')).toEqual(
      expect.arrayContaining(['@hf/db', '@hf/domain', '@hf/application', '@supabase/*']),
    );
  });

  it('lets the API compose application, db and contracts', () => {
    const groups = restrictedGroups('api');
    for (const allowed of ['@hf/application', '@hf/db', '@hf/contracts', '@hf/domain']) {
      expect(groups).not.toContain(allowed);
    }
    expect(groups).toContain('@hf/ui');
  });

  it('only lets test files import the in-memory port implementations', () => {
    const sourceGroups = restrictedGroups('api');
    expect(sourceGroups).toContain('@hf/application/testing');
    expect(sourceGroups).toContain('!@hf/application/testing');

    const testGroups = getRestrictedImportPatterns('api', { isTestFile: true }).flatMap(
      (pattern) => [...pattern.group],
    );
    expect(testGroups).not.toContain('@hf/application/testing');
    expect(testGroups).toContain('!@hf/application/testing');
  });
});
