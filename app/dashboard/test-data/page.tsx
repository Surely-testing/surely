// ============================================
// FILE: app/dashboard/test-data/page.tsx (FIXED)
// ============================================
'use client'

import React, { useState } from 'react'
import { TestDataType } from '@/types/test-data'
import { useSuiteContext } from '@/providers/SuiteContextProvider'
import TestDataTypesView from '@/components/test-data/TestDataTypesView'
import TestDataItemsView from '@/components/test-data/TestDataItemsView'
import CreateTestDataTypeForm from '@/components/test-data/CreateTestDataTypeForm'
import { Loader2 } from 'lucide-react'

type View = 'types' | 'items' | 'create'

export default function TestDataPage() {
  // ✅ Get current suite from context
  const { suite: currentSuite } = useSuiteContext()

  const [currentView, setCurrentView] = useState<View>('types')
  const [selectedType, setSelectedType] = useState<TestDataType | null>(null)

  const handleSelectType = (type: TestDataType) => {
    setSelectedType(type)
    setCurrentView('items')
  }

  const handleBackToTypes = () => {
    setSelectedType(null)
    setCurrentView('types')
  }

  const handleCreateNew = () => {
    setCurrentView('create')
  }

  const handleCreateSuccess = () => {
    setCurrentView('types')
  }

  // Show loading state while suite is not available
  if (!currentSuite) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      {/* ✅ Types View - Show when no other view is active */}
      {currentView === 'types' && (
        <TestDataTypesView
          suiteId={currentSuite.id}
          onSelectType={handleSelectType}
          onCreateNew={handleCreateNew}
        />
      )}

      {/* Items View - Show when a type is selected */}
      {currentView === 'items' && selectedType && (
        <TestDataItemsView
          type={selectedType}
          onBack={handleBackToTypes}
        />
      )}

      {/* Create Form - Show when creating new type */}
      {currentView === 'create' && (
        <CreateTestDataTypeForm
          suiteId={currentSuite.id}
          onCancel={handleBackToTypes}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  )
}