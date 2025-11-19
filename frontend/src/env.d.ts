/// <reference types="vite/client" />

declare module 'react-aframe' {
  import { ComponentType, ReactNode } from 'react';

  export interface EntityProps {
    primitive?: string;
    [key: string]: any;
  }

  export interface SceneProps {
    [key: string]: any;
  }

  export const Entity: ComponentType<EntityProps>;
  export const Scene: ComponentType<SceneProps>;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_PAYPAL_CLIENT_ID: string
  // Add other env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}