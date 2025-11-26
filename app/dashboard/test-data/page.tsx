// app/dashboard/test-data/page.tsx
'use client'

import React, { useState } from 'react'
import { TestDataType } from '@/types/test-data'
import TestDataTypesView from '@/components/test-data/TestDataTypesView'
import TestDataItemsView from '@/components/test-data/TestDataItemsView'
import CreateTestDataTypeForm from '@/components/test-data/CreateTestDataTypeForm'


type View = 'types' | 'items' | 'create'

export default function TestDataPage() {


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

  return (
    <>
      {currentView === 'items' && selectedType && (
        <TestDataItemsView
          type={selectedType}
          onBack={handleBackToTypes}
        />
      )}

      {currentView === 'create' && (
        <CreateTestDataTypeForm
                  onCancel={handleBackToTypes}
                  onSuccess={handleCreateSuccess} suiteId={''}        />
      )}
    </>
  )
}