import '@testing-library/jest-dom/vitest'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined') {
  if (!(window as any).ResizeObserver) {
    (window as any).ResizeObserver = ResizeObserverStub
  }
}

if (typeof globalThis !== 'undefined') {
  if (!(globalThis as any).ResizeObserver) {
    (globalThis as any).ResizeObserver = ResizeObserverStub
  }
}
