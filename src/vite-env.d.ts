/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY_ONEINCH: string;
  readonly VITE_ALCHEMY_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg?react' {
  import React from 'react';
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}
