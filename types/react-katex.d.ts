// react-katex doesn't ship its own types. Minimal declaration covering
// the two components we use.
declare module "react-katex" {
  import type { ComponentType } from "react";

  interface MathProps {
    math?: string;
    children?: string;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
    settings?: Record<string, unknown>;
  }

  export const InlineMath: ComponentType<MathProps>;
  export const BlockMath: ComponentType<MathProps>;
}
