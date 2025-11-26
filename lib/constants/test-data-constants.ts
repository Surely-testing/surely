// lib/constants/test-data-constants.ts
import {
  User, Mail, Phone, MapPin, CreditCard, Database,
  Calendar, Lock, Globe, Palette, FileText, Hash
} from 'lucide-react'

export const ICON_MAP = {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Database,
  Calendar,
  Lock,
  Globe,
  Palette,
  FileText,
  Hash
}

export const COLOR_MAP = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
}

export const AVAILABLE_ICONS = Object.keys(ICON_MAP)
export const AVAILABLE_COLORS = Object.keys(COLOR_MAP)