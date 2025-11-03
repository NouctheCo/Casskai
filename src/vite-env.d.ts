/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_WHATSAPP_PHONE: string;
  readonly VITE_N8N_WEBHOOK_URL: string;
  readonly VITE_STRIPE_STARTER_MONTHLY_PRICE_ID: string;
  readonly VITE_STRIPE_PRO_MONTHLY_PRICE_ID: string;
  readonly VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: string;
  readonly VITE_STRIPE_STARTER_YEARLY_PRICE_ID: string;
  readonly VITE_STRIPE_PRO_YEARLY_PRICE_ID: string;
  readonly VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID: string;
  readonly VITE_PLAUSIBLE_DOMAIN: string;
  readonly VITE_PLAUSIBLE_API_HOST: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_USE_MOCK_SERVICES: string;
  readonly VITE_BETA_FEEDBACK_ENABLED?: string;
  readonly VITE_E2E_BYPASS_AUTH?: string;
  readonly VITE_DEBUG_MODE?: string;
  readonly VITE_LOG_LEVEL?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare const gtag: (...args: any[]) => void;