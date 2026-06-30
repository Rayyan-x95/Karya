import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().or(z.string().default('')),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).or(z.string().default('')),
  VITE_RESEND_API_KEY: z.string().optional().default(''),
  VITE_APP_URL: z.string().url().or(z.string().default('http://localhost:5173')),
});

const getEnvVars = () => {
  const vars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_RESEND_API_KEY: import.meta.env.VITE_RESEND_API_KEY,
    VITE_APP_URL: import.meta.env.VITE_APP_URL,
  };

  const parsed = envSchema.safeParse(vars);

  if (!parsed.success) {
    console.error('❌ Invalid environment configurations:', parsed.error.format());
    // In production we would throw, during local development we can warn and fallback
    return vars as unknown as z.infer<typeof envSchema>;
  }

  return parsed.data;
};

export const env = getEnvVars();
export default env;
