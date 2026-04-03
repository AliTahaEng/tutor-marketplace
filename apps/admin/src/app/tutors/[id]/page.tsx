import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import { approveTutor, rejectTutor } from '@/lib/disputes/actions'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TutorDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: tutor } = await supabase
    .from('tutor_profiles')
    .select(`
      *,
      profiles!inner (full_name, created_at),
      tutor_documents (document_type, storage_path, uploaded_at)
    `)
    .eq('id', params.id)
    .single()

  if (!tutor) notFound()

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/tutors" className="text-blue-600 hover:underline text-sm">Approvals</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm">{(tutor.profiles as any)?.full_name}</span>
      </div>

      <div className="border rounded-xl p-5 space-y-3">
        <h1 className="text-xl font-bold">{(tutor.profiles as any)?.full_name}</h1>
        <div className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
          tutor.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
          tutor.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {tutor.verification_status}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Subjects</span>
            <p className="font-medium">{tutor.subjects?.join(', ') ?? 'None'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Experience</span>
            <p className="font-medium">{tutor.years_experience} years</p>
          </div>
          <div>
            <span className="text-muted-foreground">Rate</span>
            <p className="font-medium">{tutor.hourly_rate_qar} QAR/hr</p>
          </div>
          <div>
            <span className="text-muted-foreground">Session type</span>
            <p className="font-medium">{tutor.session_type}</p>
          </div>
        </div>

        {tutor.bio && (
          <div>
            <span className="text-muted-foreground text-sm">Bio</span>
            <p className="text-sm mt-1">{tutor.bio}</p>
          </div>
        )}
      </div>

      <div className="border rounded-xl p-4">
        <div className="font-semibold mb-3 text-sm">Uploaded Documents</div>
        {(tutor.tutor_documents as any[])?.length > 0 ? (
          <div className="space-y-2">
            {(tutor.tutor_documents as any[]).map((doc: any) => (
              <div key={doc.storage_path} className="flex items-center gap-2 text-sm">
                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                  {doc.document_type}
                </span>
                <span className="text-muted-foreground truncate">{doc.storage_path}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No documents uploaded.</p>
        )}
      </div>

      {tutor.verification_status === 'pending' && (
        <div className="flex gap-3">
          <form action={async () => {
            'use server'
            await approveTutor(params.id)
            redirect('/tutors')
          }}>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              Approve
            </button>
          </form>
          <form action={async (formData: FormData) => {
            'use server'
            const reason = formData.get('reason') as string
            await rejectTutor(params.id, reason)
            redirect('/tutors')
          }} className="flex gap-2">
            <input
              name="reason"
              placeholder="Rejection reason..."
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700"
            >
              Reject
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
