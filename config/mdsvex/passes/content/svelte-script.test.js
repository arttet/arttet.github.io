// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { insertSvelteImports } from './svelte-script.js';

describe('svelte-script pass', () => {
  it('returns content unchanged when imports are empty', () => {
    const content = '<script>\n  const x = 1;\n</script>';
    const result = insertSvelteImports(content, []);
    expect(result.code).toBe(content);
    expect(result.instanceScriptOpen).not.toBeNull();
  });

  it('creates a new script block when none exists', () => {
    const content = '# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain("<script>\nimport A from 'a';\n</script>");
    expect(result.instanceScriptOpen).not.toBeNull();
  });

  it('inserts script after frontmatter when creating new script', () => {
    const content = '---\ntitle: Hello\n---\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toBe(
      "---\ntitle: Hello\n---\n<script>\nimport A from 'a';\n</script>\n\n# Hello"
    );
  });

  it('inserts imports into existing script block', () => {
    const content = '<script>\n  const x = 1;\n</script>\n\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain("<script>\nimport A from 'a';");
    expect(result.code).toContain('const x = 1;');
  });

  it('does not duplicate existing imports', () => {
    const content = "<script>\n  import A from 'a';\n</script>";
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code.match(/import A from 'a';/g)).toHaveLength(1);
  });

  it('inserts only new imports when some already exist', () => {
    const content = "<script>\n  import A from 'a';\n</script>";
    const result = insertSvelteImports(content, ["import A from 'a';", "import B from 'b';"]);
    expect(result.code).toContain("import A from 'a';");
    expect(result.code).toContain("import B from 'b';");
  });

  it('ignores script tags with src attribute', () => {
    const content = '<script src="external.js"></script>\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain('<script src="external.js"></script>');
    expect(result.code).toContain("<script>\nimport A from 'a';");
  });

  it('ignores module scripts', () => {
    const content = '<script module>\n  const x = 1;\n</script>\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain('<script module>');
    expect(result.code).toContain("<script>\nimport A from 'a';");
  });

  it('ignores scripts with quoted context="module"', () => {
    const content = '<script context="module">\n  const x = 1;\n</script>\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain('<script context="module">');
    expect(result.code).toContain("<script>\nimport A from 'a';");
  });

  it('ignores scripts with single-quoted context=module', () => {
    const content = "<script context='module'>\n  const x = 1;\n</script>\n# Hello";
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain("<script context='module'>");
    expect(result.code).toContain("<script>\nimport A from 'a';");
  });

  it('ignores scripts with unquoted context=module', () => {
    const content = '<script context=module>\n  const x = 1;\n</script>\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain('<script context=module>');
    expect(result.code).toContain("<script>\nimport A from 'a';");
  });

  it('handles uppercase SCRIPT tags', () => {
    const content = '<SCRIPT>\n  const x = 1;\n</SCRIPT>';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain("<SCRIPT>\nimport A from 'a';");
  });

  it('ignores script tags inside HTML comments', () => {
    const content = '<!-- <script>ignored</script> -->\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain('<!-- <script>ignored</script> -->');
    expect(result.code).toContain("<script>\nimport A from 'a';");
  });

  it('ignores script tags inside code blocks', () => {
    const content = '```html\n<script>ignored</script>\n```\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain('```html\n<script>ignored</script>\n```');
    expect(result.code).toContain("<script>\nimport A from 'a';");
  });

  it('ignores script-like tags that are not valid script tags', () => {
    const content = '<scriptx>not a script</scriptx>\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain('<scriptx>not a script</scriptx>');
    expect(result.code).toContain("<script>\nimport A from 'a';");
  });

  it('handles malformed script tag without closing angle bracket', () => {
    const content = '<script\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain("<script>\nimport A from 'a';");
  });

  it('handles quoted angle brackets in script tag attributes', () => {
    const content = '<script title="> src is mentioned here">\n  const x = 1;\n</script>';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain('<script title="> src is mentioned here">\nimport A from \'a\';');
  });

  it('handles script tag with boolean attributes', () => {
    const content = '<script defer>\n  const x = 1;\n</script>';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain("<script defer>\nimport A from 'a';");
  });

  it('handles script tag with trailing whitespace before bracket', () => {
    const content = '<script >\n  const x = 1;\n</script>';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain("<script >\nimport A from 'a';");
  });

  it('handles whitespace around equals in attributes', () => {
    const content = '<script context = "module">\n  const x = 1;\n</script>\n# Hello';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.code).toContain('<script context = "module">');
    expect(result.code).toContain("<script>\nimport A from 'a';");
  });

  it('re-finds instance script after insertion', () => {
    const content = '<script>\n  const x = 1;\n</script>';
    const result = insertSvelteImports(content, ["import A from 'a';"]);
    expect(result.instanceScriptOpen).not.toBeNull();
    expect(result.instanceScriptOpen?.tag).toBe('<script>');
  });
});
