'use client'

import { TestCasesView } from '@/components/test-cases/TestCasesView'
import { useSupabase } from '@/providers/SupabaseProvider'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'

export default function TestCasesPage({ params }: { params: { suiteId: string } }) {
  const { supabase, user } = useSupabase()
  const [canWrite, setCanWrite] = useState(false)
  const [canAdmin, setCanAdmin] = useState(false)

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) return
      
      const { data: suite } = await supabase
        .from('test_suites')
        .select('*')
        .eq('id', params.suiteId)
        .single()

      if (suite) {
        // Check if user is in admins array - with proper boolean handling
        const isAdmin = suite.admins?.includes(user.id) ?? false
        // Check if user is in members or admins array
        const isMember = (suite.members?.includes(user.id) ?? false) || isAdmin
        
        setCanAdmin(isAdmin)
        setCanWrite(isMember)
      }
    }

    checkPermissions()
  }, [user, params.suiteId, supabase])

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="container mx-auto px-4 py-8">
        <TestCasesView 
          suiteId={params.suiteId}
          canWrite={canWrite}
        />
      </div>
    </>
  )
}