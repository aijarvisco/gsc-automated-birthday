import type { ApiResponse } from '@/types/api'
import type { 
  Team, 
  CreateTeamRequest, 
  UpdateTeamRequest, 
  DeleteTeamRequest 
} from '@/types/teams'

const API_BASE = 'https://n8n.aijarvis.co/webhook/gsc/rhbd'

class TeamsService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('Teams API Request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async getTeams(): Promise<ApiResponse<Team[]>> {
    const endpoint = `${API_BASE}/get-all-teams`
    
    const response = await this.makeRequest<any>(endpoint, {
      method: 'GET'
    })

    // Handle the nested response structure
    if (response.success && response.data) {
      try {
        // The API returns an object containing allBrands
        if (response.data.allBrands && Array.isArray(response.data.allBrands)) {
          return {
            success: true,
            data: response.data.allBrands
          }
        } else {
          return {
            success: false,
            error: 'Invalid API response structure'
          }
        }
      } catch (error) {
        return {
          success: false,
          error: 'Failed to parse API response'
        }
      }
    }

    return response
  }

  async updateTeams(teams: (CreateTeamRequest | UpdateTeamRequest)[]): Promise<ApiResponse<Team[]>> {
    const endpoint = `${API_BASE}/update-team`
    
    return this.makeRequest<Team[]>(endpoint, {
      method: 'POST',
      body: JSON.stringify(teams),
    })
  }

  async deleteTeams(teams: DeleteTeamRequest[]): Promise<ApiResponse<any>> {
    const endpoint = `${API_BASE}/delete-team`
    
    return this.makeRequest<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(teams),
    })
  }

  async createTeam(team: CreateTeamRequest): Promise<ApiResponse<Team>> {
    // Use the update endpoint for creation as well
    const response = await this.updateTeams([team])
    
    if (response.success && response.data) {
      // Handle both array and single object responses
      if (Array.isArray(response.data) && response.data.length > 0) {
        return {
          success: true,
          data: response.data[0]
        }
      } else if (!Array.isArray(response.data)) {
        // Handle single object response
        return {
          success: true,
          data: response.data as Team
        }
      }
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create team'
    }
  }

  async updateTeam(team: UpdateTeamRequest): Promise<ApiResponse<Team>> {
    const response = await this.updateTeams([team])
    
    if (response.success && response.data) {
      // Handle both array and single object responses
      if (Array.isArray(response.data) && response.data.length > 0) {
        return {
          success: true,
          data: response.data[0]
        }
      } else if (!Array.isArray(response.data)) {
        // Handle single object response
        return {
          success: true,
          data: response.data as Team
        }
      }
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update team'
    }
  }

  async deleteTeam(teamId: number): Promise<ApiResponse<any>> {
    return this.deleteTeams([{ id: teamId }])
  }
}

export const teamsService = new TeamsService()
export default teamsService