import { z } from "zod";

export const signUpSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(64),
});

export type SignUpDto = z.infer<typeof signUpSchema>;
