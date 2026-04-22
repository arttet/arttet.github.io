import { describe, expect, it } from 'vitest';
import { escXml } from './escXml';

describe('escXml intensive', () => {
  it('escapes all characters', () => {
    const input = '< > & " \'';
    const output = escXml(input);
    expect(output).toBe('&lt; &gt; &amp; &quot; &apos;');
  });

  it('handles multiple occurrences', () => {
    expect(escXml('&&')).toBe('&amp;&amp;');
    expect(escXml('<<')).toBe('&lt;&lt;');
  });

  it('handles mixed content', () => {
    expect(escXml('A < B && B > C')).toBe('A &lt; B &amp;&amp; B &gt; C');
  });
});
