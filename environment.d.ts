// This file is needed to support autocomplete for process.env
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // neon db uri
      DATABASE_URL: string;

      // stripe api key and webhook
      STRIPE_API_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;

      // public app url
      NEXT_PUBLIC_APP_URL: string;

      // imagekit keys
      NEXT_PUBLIC_IMAGEKIT_URL:string
      IMAGEKIT_PRIVATE_KEY: string;
      IMAGEKIT_PUBLIC_KEY?: string;


      // clerk admin user id(s) (separated by comma(,) and space( )). Ex: "user_123, user_456, user_789"
      CLERK_ADMIN_IDS: string;
    }
  }
}
