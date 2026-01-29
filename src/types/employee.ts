export interface EmployeeData {
  id?: string
  name: string
  email?: string
  'Data Nascimento': string | Date
  'Início Atividade'?: string | Date
  team?: string
  department?: string
  position?: string
  [key: string]: any
}

export interface ProcessedEmployeeData {
  number: string
  name: string
  formattedDate: string
  teamName: string
  teamId?: number
  originalData: EmployeeData
}

export interface ValidationStatus {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface EmployeeValidation extends ProcessedEmployeeData {
  validation: ValidationStatus
  isEdited: boolean
}

export interface BirthdayMessage {
  employeeId: string
  employeeName: string
  message?: string
  imageUrl?: string
  downloadUrl?: string
  generatedAt: string
  teamName?: string
  formattedDate?: string
  generationStatus?: boolean
}

export interface WorkflowStep {
  id: number
  name: string
  title: string
  description: string
  completed: boolean
  current: boolean
}

export interface WorkflowState {
  currentStep: number
  rawData: EmployeeData[]
  processedData: ProcessedEmployeeData[]
  validatedData: EmployeeValidation[]
  generatedMessages: BirthdayMessage[]
  isLoading: boolean
  error: string | null
  generationStarted: boolean
}