/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Let TS accept standard HTML elements
      [elemName: string]: any
    }
  }
}
