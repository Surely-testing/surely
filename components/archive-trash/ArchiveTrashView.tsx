// ============================================
// FILE: components/archive/ArchiveTrashView.tsx
// ============================================
'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Archive, Trash2, Grid, List, Search, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { ArchiveTrashGrid } from './ArchiveTrashGrid'
import { ArchiveTrashTable } from './ArchiveTrashTable'
import { BulkActionsBar, type BulkAction, type ActionOption } from '@/components/shared/bulk-action/BulkActionBar'
import { Pagination } from '@/components/shared/Pagination'
import { Tables } from '@/types/database.types'

interface ArchiveTrashViewProps {
    suiteId: string
}

type TabType = 'archived' | 'trash'
type ViewMode = 'grid' | 'table'
type AssetType = 'testCases' | 'bugs' | 'recommendations' | 'recordings' | 'sprints' | 'documents' | 'testData'

type ArchivedItem = Tables<'archived_items'> & {
    archiver?: {
        name: string
        avatar_url: string | null
    }
}

type TrashItem = Tables<'trash'> & {
    deleter?: {
        name: string
        avatar_url: string | null
    }
}

export function ArchiveTrashView({ suiteId }: ArchiveTrashViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('archived')
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>([])
    const [trashItems, setTrashItems] = useState<TrashItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [filterType, setFilterType] = useState<AssetType | 'all'>('all')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [search, setSearch] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [suiteId, activeTab])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            if (activeTab === 'archived') {
                await fetchArchivedItems()
            } else {
                await fetchTrashItems()
            }
        } catch (error) {
            logger.log('Error fetching data:', error)
            toast.error('Failed to load items')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchArchivedItems = async () => {
        const { data, error } = await supabase
            .from('archived_items')
            .select('*')
            .eq('suite_id', suiteId)
            .order('archived_at', { ascending: false })

        if (error) throw error

        const userIds = [...new Set(data?.map(item => item.archived_by) || [])]
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', userIds)

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

        const itemsWithUsers: ArchivedItem[] = data?.map(item => ({
            ...item,
            archiver: profileMap.get(item.archived_by)
        })) || []

        setArchivedItems(itemsWithUsers)
    }

    const fetchTrashItems = async () => {
        const { data, error } = await supabase
            .from('trash')
            .select('*')
            .eq('suite_id', suiteId)
            .order('deleted_at', { ascending: false })

        if (error) throw error

        const userIds = [...new Set(data?.map(item => item.deleted_by) || [])]
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', userIds)

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

        const itemsWithUsers: TrashItem[] = data?.map(item => ({
            ...item,
            deleter: profileMap.get(item.deleted_by)
        })) || []

        setTrashItems(itemsWithUsers)
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchData()
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    // Add this function to handle restore for all asset types
    const handleRestore = async (item: ArchivedItem | TrashItem) => {
        const isArchived = activeTab === 'archived'
        const tableName = isArchived ? 'archived_items' : 'trash'

        try {
            const assetData = item.asset_data as any

            // Restore based on asset type
            switch (item.asset_type) {
                case 'documents':
                    // Restore document to documents table
                    const { error: docError } = await supabase
                        .from('documents')
                        .insert({
                            id: item.asset_id,
                            title: assetData.title,
                            content: assetData.content,
                            file_type: assetData.file_type,
                            suite_id: item.suite_id,
                            created_by: assetData.created_by,
                            created_at: assetData.created_at,
                            updated_at: new Date().toISOString(),
                            archived: false
                        })

                    if (docError) throw docError
                    break

                case 'testCases':
                    // Restore test case - remove suite_id from assetData, use from item
                    const { suite_id: _tc, ...tcData } = assetData
                    const { error: tcError } = await supabase
                        .from('test_cases')
                        .insert({
                            id: item.asset_id,
                            suite_id: item.suite_id,
                            ...tcData,
                            updated_at: new Date().toISOString()
                        })

                    if (tcError) throw tcError
                    break

                case 'bugs':
                    // Restore bug
                    const { suite_id: _bug, ...bugData } = assetData
                    const { error: bugError } = await supabase
                        .from('bugs')
                        .insert({
                            id: item.asset_id,
                            suite_id: item.suite_id,
                            ...bugData,
                            updated_at: new Date().toISOString()
                        })

                    if (bugError) throw bugError
                    break

                case 'recommendations':
                    // Restore recommendation
                    const { suite_id: _rec, ...recData } = assetData
                    const { error: recError } = await supabase
                        .from('recommendations')
                        .insert({
                            id: item.asset_id,
                            suite_id: item.suite_id,
                            ...recData,
                            updated_at: new Date().toISOString()
                        })

                    if (recError) throw recError
                    break

                case 'recordings':
                    // Restore recording - only include valid columns from schema
                    const { error: recordError } = await supabase
                        .from('recordings')
                        .insert({
                            id: item.asset_id,
                            suite_id: item.suite_id,  // ✅ Use suite_id from the item, not assetData
                            sprint_id: assetData.sprint_id || null,
                            title: assetData.title,
                            url: assetData.url,
                            duration: assetData.duration || null,
                            metadata: assetData.metadata || {},
                            created_by: assetData.created_by,
                            created_at: assetData.created_at,
                            updated_at: new Date().toISOString()
                        })

                    if (recordError) throw recordError
                    break

                case 'sprints':
                    // Restore sprint
                    const { suite_id: _sprint, ...sprintData } = assetData
                    const { error: sprintError } = await supabase
                        .from('sprints')
                        .insert({
                            id: item.asset_id,
                            suite_id: item.suite_id,
                            ...sprintData,
                            updated_at: new Date().toISOString()
                        })

                    if (sprintError) throw sprintError
                    break

                case 'testData':
                    // Restore test data
                    const { suite_id: _data, ...testData } = assetData
                    const { error: dataError } = await supabase
                        .from('test_data')
                        .insert({
                            id: item.asset_id,
                            suite_id: item.suite_id,
                            ...testData,
                            updated_at: new Date().toISOString()
                        })

                    if (dataError) throw dataError
                    break

                default:
                    throw new Error(`Unknown asset type: ${item.asset_type}`)
            }

            // Remove from archive/trash after successful restore
            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .eq('id', item.id)

            if (deleteError) throw deleteError

            toast.success(`${item.asset_type} restored successfully`)
            await fetchData()
        } catch (error: any) {
            logger.log('Restore error:', error)
            toast.error('Failed to restore item', {
                description: error.message || 'Check if the item already exists or schema mismatch'
            })
        }
    }

    const handlePermanentDelete = async (item: TrashItem) => {
        // Use browser's confirm dialog for consistency with your pattern
        if (!confirm(`Permanently delete this item? This action cannot be undone.`)) return

        try {
            const { error } = await supabase
                .from('trash')
                .delete()
                .eq('id', item.id)

            if (error) throw error

            toast.success('Item permanently deleted')
            await fetchData()
        } catch (error: any) {
            logger.log('Delete error:', error)
            toast.error('Failed to delete item', { description: error.message })
        }
    }

    const handleBulkAction = async (
        actionId: string,
        selectedIds: string[],
        actionConfig: BulkAction,
        selectedOption?: ActionOption | null
    ) => {
        try {
            switch (actionId) {
                case 'restore':
                    // Implement bulk restore
                    toast.info('Bulk restore - implement based on your needs')
                    break
                case 'permanent-delete':
                    if (!confirm(`Permanently delete ${selectedIds.length} item(s)?`)) return
                    await Promise.all(selectedIds.map(id =>
                        supabase.from('trash').delete().eq('id', id)
                    ))
                    toast.success(`${selectedIds.length} item(s) permanently deleted`)
                    break
                default:
                    toast.error('Unknown action')
            }
            setSelectedIds([])
            await fetchData()
        } catch (error: any) {
            toast.error('Bulk action failed', { description: error?.message })
        }
    }

    const handleSelectAll = () => {
        setSelectedIds(
            selectedIds.length === paginatedItems.length ? [] : paginatedItems.map(item => item.id)
        )
    }

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const currentItems = activeTab === 'archived' ? archivedItems : trashItems
    const filteredItems = useMemo(() => {
        let items = filterType === 'all'
            ? currentItems
            : currentItems.filter(item => item.asset_type === filterType)

        // Apply search filter
        if (search) {
            const query = search.toLowerCase()
            items = items.filter(item => {
                const data = item.asset_data as any
                const title = data?.title || data?.name || data?.description || ''
                return title.toLowerCase().includes(query)
            })
        }

        return items
    }, [currentItems, filterType, search])

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredItems.slice(startIndex, endIndex)
    }, [filteredItems, currentPage, itemsPerPage])

    const tabs = [
        { id: 'archived', label: 'Archived', icon: Archive },
        { id: 'trash', label: 'Trash', icon: Trash2 },
    ]

    const activeFiltersCount = filterType !== 'all' ? 1 : 0

    return (
        <>
            <div className="space-y-4 md:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                            {activeTab === 'archived' ? 'Archive' : 'Trash'}
                        </h1>
                        <span className="text-sm text-muted-foreground">
                            ({filteredItems.length})
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center justify-center w-10 h-10 text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div>
                    <nav className="flex overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id as TabType)
                                        setSelectedIds([])
                                        setFilterType('all')
                                    }}
                                    className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${isActive
                                        ? 'border-primary text-primary bg-primary/5'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Unified Controls Bar */}
                    <div className="bg-card border-b border-border">
                        <div className="px-3 py-2">
                            <div className="flex flex-col gap-3 lg:gap-0">
                                {/* Mobile Layout */}
                                <div className="lg:hidden space-y-3">
                                    {/* Search */}
                                    <div className="relative w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Search items..."
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value)
                                                setCurrentPage(1)
                                            }}
                                            disabled={isLoading}
                                            className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                                        />
                                    </div>

                                    {/* Filter */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            disabled={isLoading}
                                            className="relative inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                                        >
                                            <Filter className="w-4 h-4" />
                                            <span>Filter</span>
                                            {activeFiltersCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                                                    {activeFiltersCount}
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Select All & View Toggle */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                                                onChange={handleSelectAll}
                                                disabled={isLoading}
                                                className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-muted-foreground">Select All</span>
                                        </div>

                                        <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                                            <button
                                                onClick={() => setViewMode('grid')}
                                                disabled={isLoading}
                                                className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'grid'
                                                    ? 'bg-primary text-primary-foreground shadow-theme-sm'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                    }`}
                                                title="Grid View"
                                            >
                                                <Grid className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setViewMode('table')}
                                                disabled={isLoading}
                                                className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'table'
                                                    ? 'bg-primary text-primary-foreground shadow-theme-sm'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                    }`}
                                                title="Table View"
                                            >
                                                <List className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden lg:flex lg:flex-col lg:gap-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                                                onChange={handleSelectAll}
                                                disabled={isLoading}
                                                className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-muted-foreground">Select All</span>
                                        </div>

                                        <div className="flex items-center gap-3 flex-1 justify-end">
                                            {/* Search */}
                                            <div className="relative flex-1 max-w-xs">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                <input
                                                    type="text"
                                                    placeholder="Search items..."
                                                    value={search}
                                                    onChange={(e) => {
                                                        setSearch(e.target.value)
                                                        setCurrentPage(1)
                                                    }}
                                                    disabled={isLoading}
                                                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                                                />
                                            </div>

                                            {/* Filter Button */}
                                            <button
                                                onClick={() => setShowFilters(!showFilters)}
                                                disabled={isLoading}
                                                className="relative inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50"
                                            >
                                                <Filter className="w-4 h-4" />
                                                Filter
                                                {activeFiltersCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                                                        {activeFiltersCount}
                                                    </span>
                                                )}
                                            </button>

                                            {/* View Toggle */}
                                            <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                                                <button
                                                    onClick={() => setViewMode('grid')}
                                                    disabled={isLoading}
                                                    className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'grid'
                                                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                        }`}
                                                    title="Grid View"
                                                >
                                                    <Grid className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('table')}
                                                    disabled={isLoading}
                                                    className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'table'
                                                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                        }`}
                                                    title="Table View"
                                                >
                                                    <List className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters Panel */}
                            {showFilters && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                                        {activeFiltersCount > 0 && (
                                            <button
                                                onClick={() => setFilterType('all')}
                                                className="px-3 py-1 text-xs font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                                                Asset Type
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { value: 'testCases', label: '🧪 Test Cases' },
                                                    { value: 'bugs', label: '🐛 Bugs' },
                                                    { value: 'documents', label: '📄 Documents' },
                                                    { value: 'recordings', label: '📹 Recordings' },
                                                    { value: 'recommendations', label: '💡 Suggestions' },
                                                    { value: 'sprints', label: '📅 Sprints' },
                                                    { value: 'testData', label: '💾 Test Data' }
                                                ].map(type => (
                                                    <button
                                                        key={type.value}
                                                        onClick={() => setFilterType(filterType === type.value ? 'all' : type.value as AssetType)}
                                                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${filterType === type.value
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'bg-background text-foreground border-border hover:border-primary'
                                                            }`}
                                                    >
                                                        {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-0">
                        {viewMode === 'grid' ? (
                            <ArchiveTrashGrid
                                items={paginatedItems}
                                activeTab={activeTab}
                                onRestore={handleRestore}
                                onDelete={handlePermanentDelete}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                                isLoading={isLoading}
                            />
                        ) : (
                            <ArchiveTrashTable
                                items={paginatedItems}
                                activeTab={activeTab}
                                onRestore={handleRestore}
                                onDelete={handlePermanentDelete}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                                isLoading={isLoading}
                            />
                        )}

                        {/* Pagination */}
                        {filteredItems.length > itemsPerPage && (
                            <div className="mt-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={filteredItems.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={(page) => {
                                        setCurrentPage(page)
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                    }}
                                    onItemsPerPageChange={(items) => {
                                        setItemsPerPage(items)
                                        setCurrentPage(1)
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BulkActionsBar
                selectedItems={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                assetType={activeTab === 'archived' ? 'archive' : 'trash'}
                onAction={handleBulkAction}
            />
        </>
    )
}