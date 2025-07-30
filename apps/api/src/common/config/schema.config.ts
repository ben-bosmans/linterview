import { z } from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production']),
});

export const validateConfig = (config: Record<string, unknown>) => {
  return z.parse(configSchema, config);
};

export type Config = z.infer<typeof configSchema>;
