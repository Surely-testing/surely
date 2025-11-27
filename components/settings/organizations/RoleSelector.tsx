// ============================================
// FILE: components/settings/organizations/RoleSelector.tsx
// ============================================
'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Crown, Shield, Users, User } from 'lucide-react'

interface RoleSelectorProps {
  value: string
  onChange: (value: string) => void
  type: 'organization' | 'suite'
}

export default function RoleSelector({ value, onChange, type }: RoleSelectorProps) {
  const organizationRoles = [
    { value: 'admin', label: 'Admin', icon: Shield, description: 'Full access to manage organization' },
    { value: 'manager', label: 'Manager', icon: Users, description: 'Can manage members and projects' },
    { value: 'member', label: 'Member', icon: User, description: 'Basic access to organization resources' },
  ]

  const suiteRoles = [
    { value: 'admin', label: 'Admin', icon: Shield, description: 'Full access to manage test suite' },
    { value: 'member', label: 'Member', icon: User, description: 'Can view and edit test cases' },
  ]

  const roles = type === 'organization' ? organizationRoles : suiteRoles

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <SelectItem key={role.value} value={role.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div>
                  <p className="font-medium">{role.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}