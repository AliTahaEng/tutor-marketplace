'use client'

import { setLocale } from '@/lib/i18n/actions'

interface Props {
  currentLocale: string
}

export function LanguageSwitcher({ currentLocale }: Props) {
  return (
    <div className="flex gap-1 items-center">
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          currentLocale === 'en'
            ? 'font-bold text-blue-600'
            : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        EN
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => setLocale('ar')}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          currentLocale === 'ar'
            ? 'font-bold text-blue-600'
            : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        ع
      </button>
    </div>
  )
}
