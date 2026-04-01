import { saveTutorProfile } from '@/lib/tutor/actions'
import { requireRole } from '@/lib/auth/guards'

export default async function TutorOnboardingPage() {
  await requireRole('tutor')

  const AREAS = ['Doha', 'Al Rayyan', 'Al Wakra', 'Al Khor', 'Lusail', 'Al Daayen', 'Al Shamal', 'Al Shahaniya']
  const LANGUAGES = ['Arabic', 'English', 'French', 'Urdu', 'Hindi']

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Set Up Your Tutor Profile</h1>
      <p className="text-gray-500 mb-6">Complete your profile to get approved and start getting bookings.</p>

      <form action={saveTutorProfile} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Bio (min 20 characters)</label>
          <textarea name="bio" rows={4} required minLength={20}
            placeholder="Tell students about yourself, your experience, and teaching style..."
            className="w-full border rounded-xl px-3 py-2 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Years Experience</label>
            <input name="yearsExperience" type="number" min="0" max="60" required
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hourly Rate (QAR)</label>
            <input name="hourlyRateQar" type="number" min="1" max="5000" required
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Session Type</label>
          <select name="sessionType" className="w-full border rounded-lg px-3 py-2">
            <option value="both">Both In-person & Online</option>
            <option value="in_person">In-person Only</option>
            <option value="online">Online Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Areas in Qatar (select all that apply)</label>
          <div className="grid grid-cols-2 gap-2">
            {AREAS.map(area => (
              <label key={area} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="areas" value={area} className="accent-blue-600" />
                {area}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subjects (comma-separated)</label>
          <input name="subjects" type="text" required
            placeholder="Mathematics, Physics, Chemistry"
            className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Languages Taught</label>
          <div className="flex gap-4 flex-wrap">
            {LANGUAGES.map(lang => (
              <label key={lang} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="languagesTaught" value={lang} className="accent-blue-600" />
                {lang}
              </label>
            ))}
          </div>
        </div>

        <button type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700">
          Save Profile & Submit for Review
        </button>
      </form>
    </div>
  )
}
