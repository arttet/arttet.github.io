import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Global mock for Shiki highlighter to avoid heavy processing during unit tests
vi.mock('$lib/highlighter', () => ({
  getHighlighter: vi.fn().mockImplementation(() =>
    Promise.resolve({
      getLoadedLanguages: vi.fn().mockReturnValue(['typescript']),
      loadLanguage: vi.fn().mockResolvedValue(undefined),
      codeToHtml: vi
        .fn()
        .mockImplementation((code: string) => `<pre class="shiki"><code>${code}</code></pre>`),
    })
  ),
  loadLanguage: vi.fn().mockImplementation(() => Promise.resolve()),
  setThemes: vi.fn(),
  highlightCode: vi
    .fn()
    .mockImplementation((code: string) => `<pre class="shiki"><code>${code}</code></pre>`),
  LANGS: ['typescript', 'go', 'rust'],
}));

// WebGPU Constants
const GPU_CONSTANTS = {
  BufferUsage: {
    MAP_READ: 1,
    MAP_WRITE: 2,
    COPY_SRC: 4,
    COPY_DST: 8,
    INDEX: 16,
    VERTEX: 32,
    UNIFORM: 64,
    STORAGE: 128,
    INDIRECT: 256,
    QUERY_RESOLVE: 512,
  },
  TextureUsage: {
    COPY_SRC: 1,
    COPY_DST: 2,
    TEXTURE_BINDING: 4,
    STORAGE_BINDING: 8,
    RENDER_ATTACHMENT: 16,
  },
  ShaderStage: { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 },
};

vi.stubGlobal('GPUBufferUsage', GPU_CONSTANTS.BufferUsage);
vi.stubGlobal('GPUTextureUsage', GPU_CONSTANTS.TextureUsage);
vi.stubGlobal('GPUShaderStage', GPU_CONSTANTS.ShaderStage);

function GPUCanvasContext() {}

vi.stubGlobal('GPUCanvasContext', GPUCanvasContext);

vi.stubGlobal(
  'GPUDevice',
  class GPUDevice {
    createShaderModule = vi.fn().mockReturnValue({ destroy: vi.fn() });
    createRenderPipeline = vi.fn().mockResolvedValue({});
    createBindGroupLayout = vi.fn().mockReturnValue({});
    createBuffer = vi.fn().mockReturnValue({ destroy: vi.fn() });
    createSampler = vi.fn().mockReturnValue({});
    createTexture = vi.fn().mockReturnValue({ createView: vi.fn(), destroy: vi.fn() });
    queue = { writeBuffer: vi.fn() };
    destroy = vi.fn();
  }
);

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
);

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
);
