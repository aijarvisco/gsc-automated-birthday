export interface Team {
  id: number
  initial_name: string
  correct_name: string | null
  created_at: string
  updated_at: string
}

export interface CreateTeamRequest {
  initial_name: string
  correct_name: string
}

export interface UpdateTeamRequest {
  id: number
  initial_name?: string
  correct_name?: string
}

export interface DeleteTeamRequest {
  id: number
}

export interface TeamsState {
  teams: Team[]
  isLoading: boolean
  error: string | null
  searchTerm: string
  sortField: 'initial_name' | 'correct_name' | 'updated_at'
  sortDirection: 'asc' | 'desc'
}

export interface TeamValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface TeamFormData {
  initial_name: string
  correct_name: string
}

export interface TeamsApiResponse {
  success: boolean
  data?: Team[]
  message?: string
  error?: string
}

export interface TeamsBulkOperation {
  action: 'update' | 'delete'
  teams: Team[]
}