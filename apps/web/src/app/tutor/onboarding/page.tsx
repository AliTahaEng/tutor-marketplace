import { saveTutorProfile } from '@/lib/tutor/actions'
import { requireRole } from '@/lib/auth/guards'

export default async function TutorOnboardingPage() {
  await requireRole('tutor')

  const AREAS = ['Doha', 'Al Rayyan', 'Al Wakra', 'Al Khor', 'Lusail', 'Al Daayen', 'Al Shamal', 'Al Shahaniya']
  const LANGUAGES = ['Arabic', 'English', 'French', 'Urdu', 'Hindi']

  const inputStyle = {
    width: '100%',
    border: '1.5px solid var(--color-border)',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '14px',
    color: 'var(--color-text)',
    background: '#fff',
    boxSizing: 'border-box' as const,
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: '6px',
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Dark hero header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '48px 32px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
            Set Up Your Tutor Profile
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', margin: 0 }}>
            Complete your profile to get approved and start getting bookings.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 32px' }}>
        {/* Form card */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-card)',
          padding: '36px',
          border: '1px solid var(--color-border)',
        }}>
          <form action={saveTutorProfile as unknown as (formData: FormData) => void} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <div>
              <label style={labelStyle}>Bio (min 20 characters)</label>
              <textarea
                name="bio"
                rows={4}
                required
                minLength={20}
                placeholder="Tell students about yourself, your experience, and teaching style..."
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Years Experience</label>
                <input
                  name="yearsExperience"
                  type="number"
                  min="0"
                  max="60"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Hourly Rate (QAR)</label>
                <input
                  name="hourlyRateQar"
                  type="number"
                  min="1"
                  max="5000"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Session Type</label>
              <select name="sessionType" style={inputStyle}>
                <option value="both">Both In-person &amp; Online</option>
                <option value="in_person">In-person Only</option>
                <option value="online">Online Only</option>
              </select>
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Areas in Qatar (select all that apply)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {AREAS.map(area => (
                  <label key={area} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <input
                      type="checkbox"
                      name="areas"
                      value={area}
                      style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                    />
                    {area}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Subjects (comma-separated)</label>
              <input
                name="subjects"
                type="text"
                required
                placeholder="Mathematics, Physics, Chemistry"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Languages Taught</label>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {LANGUAGES.map(lang => (
                  <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <input
                      type="checkbox"
                      name="languagesTaught"
                      value={lang}
                      style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                    />
                    {lang}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save Profile &amp; Submit for Review
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
