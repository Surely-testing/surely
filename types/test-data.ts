// types/test-data.ts (at root level, not in lib/)

export interface TestDataType {
    id: string
    suite_id: string
    name: string
    description: string | null
    icon: string | null;
    color: string | null;
    created_by: string;
    created_at: string | null;
    updated_at: string | null;
    item_count?: number
}

export interface TestDataItem {
    id: string
    type_id: string
    suite_id: string
    value: string
    metadata?: Record<string, any>
    created_by: string
    created_at: string | null;
    updated_at: string | null;
}

export interface CreateTestDataTypeInput {
    suite_id: string
    name: string
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    created_by: string;
}

export interface UpdateTestDataTypeInput {
    name?: string
    description?: string | null;
    icon?: string | null;
    color?: string | null;
}

export interface CreateTestDataItemInput {
    type_id: string
    suite_id: string
    value: string
    metadata?: Record<string, any>
}

export type IconName =
    | 'User' | 'Mail' | 'Phone' | 'MapPin' | 'CreditCard'
    | 'Database' | 'Calendar' | 'Lock' | 'Globe' | 'Palette'
    | 'FileText' | 'Hash'

export type ColorName =
    | 'blue' | 'purple' | 'green' | 'red' | 'yellow'
    | 'indigo' | 'pink' | 'gray' | 'cyan' | 'orange'
    | 'teal' | 'violet'
