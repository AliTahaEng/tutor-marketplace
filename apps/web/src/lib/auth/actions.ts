'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const StudentSignUpSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  preferredLanguage: z.enum(['en', 'ar']),
})

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// State shape used with useFormState — always { error: string }
export type AuthState = { error: string }

export async function signUpStudent(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = StudentSignUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    preferredLanguage: formData.get('preferredLanguage') ?? 'en',
  })

  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: 'student',
        preferred_language: parsed.data.preferredLanguage,
      },
    },
  })

  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signUpTutor(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = StudentSignUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    preferredLanguage: formData.get('preferredLanguage') ?? 'en',
  })

  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: 'tutor',
        preferred_language: parsed.data.preferredLanguage,
      },
    },
  })

  if (error) return { error: error.message }
  redirect('/tutor/onboarding')
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) return { error: 'Please enter a valid email and password.' }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  // Don't reveal which field is wrong
  if (error) return { error: 'Invalid email or password. Please try again.' }
  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
