import type { 
  ProcessEmployeesRequest, 
  ProcessEmployeesResponse,
  GenerateBirthdayImagesRequest,
  GenerateBirthdayImagesResponse,
  GetAllCollaboratorsResponse,
  ApiResponse 
} from '@/types/api'
import type { EmployeeData, LifetimeCollaborator } from '@/types/employee'

const API_BASE = 'https://n8n.aijarvis.co/webhook/gsc'

class ApiService {
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
      console.error('API Request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async processEmployeesData(employees: EmployeeData[]): Promise<ApiResponse<ProcessEmployeesResponse>> {
    const endpoint = `${API_BASE}/rhbd/process-employees-data`
    
    return this.makeRequest<ProcessEmployeesResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(employees),
    })
  }

  async generateBirthdayImages(employees: any[]): Promise<ApiResponse<GenerateBirthdayImagesResponse>> {
    const endpoint = `${API_BASE}/rhbd/generate-birthday-images`
    
    return this.makeRequest<GenerateBirthdayImagesResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(employees),
    })
  }

  async getAllCollaborators(): Promise<ApiResponse<GetAllCollaboratorsResponse>> {
    const endpoint = `${API_BASE}/rhbd/get-all-collaborators`
    
    return this.makeRequest<GetAllCollaboratorsResponse>(endpoint, {
      method: 'GET',
    })
  }

  // Legacy endpoint for backward compatibility
  async sendBirthdayData(employees: EmployeeData[]): Promise<ApiResponse<any>> {
    const endpoint = `${API_BASE}/birthdays`
    
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(employees),
    })
  }
}

export const apiService = new ApiService()
export default apiService