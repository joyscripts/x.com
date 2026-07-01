import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .regex(/^\+?[1-9]\d{7,19}$/);
