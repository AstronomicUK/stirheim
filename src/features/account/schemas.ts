// Client-side validation for the account forms. Mirrors the DB constraint on display_name
// (1-40 characters) and Supabase's default minimum password length (8).

import { z } from 'zod'

export const PASSWORD_MIN = 8
export const DISPLAY_NAME_MAX = 40

export const emailSchema = z.string().trim().min(1, 'Enter your email.').email('Enter a valid email address.')

export const passwordSchema = z
  .string()
  .min(1, 'Enter a password.')
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .max(72, 'Use at most 72 characters.')

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a display name.')
  .max(DISPLAY_NAME_MAX, `Use at most ${DISPLAY_NAME_MAX} characters.`)

export const signInSchema = z.object({
  email: emailSchema,
  // Sign-in only checks presence: the server decides whether it matches.
  password: z.string().min(1, 'Enter your password.'),
})

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
})

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'The two passwords do not match.', path: ['confirm'] })

export const displayNameFormSchema = z.object({ displayName: displayNameSchema })

export type FieldErrors<T> = Partial<Record<keyof T, string>>

/** Runs a schema and returns either the parsed values or the first message per field. */
export function validate<S extends z.ZodType>(
  schema: S,
  values: unknown,
): { ok: true; data: z.output<S> } | { ok: false; errors: FieldErrors<z.output<S>> } {
  const result = schema.safeParse(values)
  if (result.success) return { ok: true, data: result.data }
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!(key in errors)) errors[key] = issue.message
  }
  return { ok: false, errors: errors as FieldErrors<z.output<S>> }
}
