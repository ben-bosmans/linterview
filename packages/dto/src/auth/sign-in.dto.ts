import { z } from "zod";

export const signInSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string(),
});

export type SignInDto = z.infer<typeof signInSchema>;
