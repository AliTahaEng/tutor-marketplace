'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { Locale } from '@/i18n'

export async function setLocale(locale: Locale): Promise<void> {
  cookies().set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}
