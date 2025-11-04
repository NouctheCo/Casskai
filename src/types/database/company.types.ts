// Types liés aux entreprises et utilisateurs
import type { Database } from '../supabase'

// Types pour les tables companies
export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

// Types pour les relations utilisateur-entreprise
export type UserCompany = Database['public']['Tables']['user_companies']['Row']
export type UserCompanyInsert = Database['public']['Tables']['user_companies']['Insert'] 
export type UserCompanyUpdate = Database['public']['Tables']['user_companies']['Update']

// Types métier pour les entreprises
export interface CompanyWithUsers extends Company {
  user_companies?: Array<UserCompany & {
    users?: {
      id: string
      email: string
      full_name: string | null
    }
  }>
}

export interface CompanyStats {
  id: string
  name: string
  totalAccounts: number
  totalTransactions: number
  totalUsers: number
  isActive: boolean
  createdAt: string
}

export type CompanyRole = 'owner' | 'admin' | 'accountant' | 'viewer'

export interface UserCompanyWithDetails extends UserCompany {
  company: Company
  role_details: {
    name: string
    permissions: string[]
  }
}
