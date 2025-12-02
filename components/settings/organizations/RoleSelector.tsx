
// ============================================
// FILE 5: components/settings/organizations/RoleSelector.tsx
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
    { 
      value: 'admin', 
      label: 'Admin', 
      icon: Shield, 
      description: 'Full access to manage organization' 
    },
    { 
      value: 'manager', 
      label: 'Manager', 
      icon: Users, 
      description: 'Can manage members and projects' 
    },
    { 
      value: 'member', 
      label: 'Member', 
      icon: User, 
      description: 'Basic access to organization resources' 
    },
  ]

  const suiteRoles = [
    { 
      value: 'admin', 
      label: 'Admin', 
      icon: Shield, 
      description: 'Full access to manage test suite' 
    },
    { 
      value: 'member', 
      label: 'Member', 
      icon: User, 
      description: 'Can view and edit test cases' 
    },
  ]

  const roles = type === 'organization' ? organizationRoles : suiteRoles

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 sm:h-11">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent className="w-[calc(100vw-2rem)] sm:w-full max-w-[500px]">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <SelectItem 
              key={role.value} 
              value={role.value}
              className="py-3"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">{role.label}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
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

