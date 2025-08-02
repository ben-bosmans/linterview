import { z } from "zod";

export const accessTokenSchema = z.object({
  accessToken: z.jwt(),
});

export type AccessTokenDto = z.infer<typeof accessTokenSchema>;
