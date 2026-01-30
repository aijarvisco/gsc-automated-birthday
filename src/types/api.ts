export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ProcessEmployeesRequest {
  employees: any[]
}

export interface CollaboratorObj {
  number: string
  name: string
  formattedDate: string
  teamName: string
}

export interface EmployeeData {
  collaboratorObj: CollaboratorObj
}

export interface ProcessEmployeesResponse {
  employeesData: EmployeeData[]
}

export interface GenerateBirthdayImagesRequest {
  employees: Array<{
    id: string
    name: string
    email: string
    birthDate: string
    team: string
    department: string
    position: string
  }>
}

export interface GenerationResultItem {
  number: string
  name: string
  formattedDate: string
  teamName: string
  teamId: string
  originalData: any
  validation: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
  isEdited: boolean
  imageURL: string
  downloadURL: string
  generationStatus: {
    status: boolean
  }
}

export interface GenerateBirthdayImagesResponse {
  generationResult: GenerationResultItem[]
}

export interface GetAllCollaboratorsResponse {
  collaborators: Array<{
    id: number
    name: string
    team: string
    image_url: string
    created_at: string
    number: string
    birthday_date: string
  }>
}