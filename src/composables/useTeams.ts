import { ref, reactive, computed } from 'vue'
import type { 
  Team, 
  TeamsState, 
  CreateTeamRequest, 
  UpdateTeamRequest,
  TeamValidation 
} from '@/types/teams'
import { teamsService } from '@/services/teams'

const STORAGE_KEY = 'teams-management-state'

export function useTeams() {
  const state = reactive<TeamsState>({
    teams: [],
    isLoading: false,
    error: null,
    searchTerm: '',
    sortField: 'updated_at',
    sortDirection: 'desc'
  })

  const filteredTeams = computed(() => {
    // Ensure state.teams is always an array
    if (!Array.isArray(state.teams)) {
      return []
    }

    let filtered = state.teams

    // Apply search filter
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase()
      filtered = filtered.filter(team => 
        team.initial_name?.toLowerCase().includes(term) ||
        (team.correct_name && team.correct_name.toLowerCase().includes(term))
      )
    }

    // Apply sorting - create a new array to avoid mutating the original
    const sortedFiltered = [...filtered].sort((a, b) => {
      let aValue = a[state.sortField]
      let bValue = b[state.sortField]
      
      if (state.sortField === 'updated_at') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else {
        aValue = String(aValue || '').toLowerCase()
        bValue = String(bValue || '').toLowerCase()
      }
      
      if (state.sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return sortedFiltered
  })

  const teamStats = computed(() => {
    const teams = Array.isArray(state.teams) ? state.teams : []
    
    return {
      total: teams.length,
      filtered: filteredTeams.value.length,
      recentlyUpdated: teams.filter(team => {
        try {
          const updatedDate = new Date(team.updated_at)
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          return updatedDate > dayAgo
        } catch {
          return false
        }
      }).length
    }
  })

  // Load state from localStorage
  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedState = JSON.parse(saved)
        Object.assign(state, savedState)
      }
    } catch (error) {
      console.error('Failed to load teams state:', error)
    }
  }

  // Save state to localStorage
  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        teams: state.teams,
        searchTerm: state.searchTerm,
        sortField: state.sortField,
        sortDirection: state.sortDirection
      }))
    } catch (error) {
      console.error('Failed to save teams state:', error)
    }
  }

  const setLoading = (loading: boolean) => {
    state.isLoading = loading
  }

  const setError = (error: string | null) => {
    state.error = error
  }

  const setSearchTerm = (term: string) => {
    state.searchTerm = term
    saveState()
  }

  const setSorting = (field: TeamsState['sortField'], direction: TeamsState['sortDirection']) => {
    state.sortField = field
    state.sortDirection = direction
    saveState()
  }

  const validateTeam = (team: Partial<Team>): TeamValidation => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!team.initial_name?.trim()) {
      errors.push('Initial name is required')
    }
    if (!team.correct_name?.trim()) {
      errors.push('Correct name is required')
    }

    // Check for duplicates
    if (team.initial_name) {
      const duplicate = state.teams.find(t => 
        t.initial_name.toLowerCase() === team.initial_name!.toLowerCase() && 
        t.id !== team.id
      )
      if (duplicate) {
        errors.push('A team with this initial name already exists')
      }
    }

    // Length checks
    if (team.initial_name && team.initial_name.length > 100) {
      warnings.push('Initial name is very long')
    }
    if (team.correct_name && team.correct_name.length > 100) {
      warnings.push('Correct name is very long')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  const fetchTeams = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await teamsService.getTeams()
      
      if (response.success && response.data) {
        // Ensure response.data is an array
        if (Array.isArray(response.data)) {
          state.teams = response.data
        } else {
          console.warn('API response is not an array:', response.data)
          state.teams = []
          setError('Invalid data format received from server')
        }
        saveState()
      } else {
        setError(response.error || 'Failed to fetch teams')
        state.teams = [] // Ensure it's an empty array on error
      }
    } catch (error) {
      console.error('Fetch teams error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      state.teams = [] // Ensure it's an empty array on error
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async (teamData: CreateTeamRequest) => {
    const validation = validateTeam(teamData)
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await teamsService.createTeam(teamData)
      
      if (response.success && response.data) {
        state.teams.push(response.data)
        saveState()
        return true
      } else {
        setError(response.error || 'Failed to create team')
        return false
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateTeam = async (teamData: UpdateTeamRequest) => {
    const validation = validateTeam(teamData)
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await teamsService.updateTeam(teamData)
      
      if (response.success && response.data) {
        const index = state.teams.findIndex(t => t.id === teamData.id)
        if (index !== -1) {
          state.teams[index] = response.data
        }
        saveState()
        return true
      } else {
        setError(response.error || 'Failed to update team')
        return false
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteTeam = async (teamId: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await teamsService.deleteTeam(teamId)
      
      if (response.success) {
        state.teams = state.teams.filter(t => t.id !== teamId)
        saveState()
        return true
      } else {
        setError(response.error || 'Failed to delete team')
        return false
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }

  const bulkDeleteTeams = async (teamIds: number[]) => {
    setLoading(true)
    setError(null)

    try {
      const deleteRequests = teamIds.map(id => ({ id }))
      const response = await teamsService.deleteTeams(deleteRequests)
      
      if (response.success) {
        state.teams = state.teams.filter(t => !teamIds.includes(t.id))
        saveState()
        return true
      } else {
        setError(response.error || 'Failed to delete teams')
        return false
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    state.error = null
  }

  const resetState = () => {
    Object.assign(state, {
      teams: [],
      isLoading: false,
      error: null,
      searchTerm: '',
      sortField: 'updated_at' as const,
      sortDirection: 'desc' as const
    })
    localStorage.removeItem(STORAGE_KEY)
  }

  // Initialize
  loadState()

  return {
    state,
    filteredTeams,
    teamStats,
    setSearchTerm,
    setSorting,
    validateTeam,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    bulkDeleteTeams,
    clearError,
    resetState
  }
}