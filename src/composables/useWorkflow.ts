import { ref, reactive, computed } from 'vue'
import type { EmployeeData, ProcessedEmployeeData, WorkflowStep, WorkflowState } from '@/types/employee'
import type { GenerateBirthdayImagesResponse } from '@/types/api'
import { apiService } from '@/services/api'

const STORAGE_KEY = 'birthday-workflow-state'

export function useWorkflow() {
  const steps = ref<WorkflowStep[]>([
    {
      id: 1,
      name: 'upload',
      title: 'Data Upload',
      description: 'Upload employee data file',
      completed: false,
      current: true
    },
    {
      id: 2,
      name: 'processing',
      title: 'Data Processing',
      description: 'Process and enrich employee data',
      completed: false,
      current: false
    },
    {
      id: 3,
      name: 'overview',
      title: 'Data Overview',
      description: 'Review processed employee data',
      completed: false,
      current: false
    },
    {
      id: 4,
      name: 'validation',
      title: 'Data Validation',
      description: 'Validate and correct employee information',
      completed: false,
      current: false
    },
    {
      id: 5,
      name: 'generation',
      title: 'Generate Messages',
      description: 'Generate birthday messages and images',
      completed: false,
      current: false
    }
  ])

  const state = reactive<WorkflowState>({
    currentStep: 1,
    rawData: [],
    processedData: [],
    validatedData: [],
    generatedMessages: [],
    isLoading: false,
    error: null,
    generationStarted: false
  })

  const currentStepData = computed(() => 
    steps.value.find(step => step.id === state.currentStep)
  )

  const canGoNext = computed(() => {
    const currentStepObj = steps.value.find(step => step.id === state.currentStep)
    return currentStepObj?.completed || false
  })

  const canGoPrevious = computed(() => state.currentStep > 1)

  const isFirstStep = computed(() => state.currentStep === 1)
  const isLastStep = computed(() => state.currentStep === steps.value.length)

  // Load state from sessionStorage
  const loadState = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedState = JSON.parse(saved)
        Object.assign(state, savedState)
        
        // Update steps based on saved state
        steps.value.forEach(step => {
          step.current = step.id === state.currentStep
          step.completed = step.id < state.currentStep || 
            (step.id === 1 && state.rawData.length > 0) ||
            (step.id === 2 && state.processedData.length > 0) ||
            (step.id === 3 && state.processedData.length > 0)
        })
      }
    } catch (error) {
      console.error('Failed to load workflow state:', error)
    }
  }

  // Save state to sessionStorage
  const saveState = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save workflow state:', error)
    }
  }

  const setRawData = (data: EmployeeData[]) => {
    state.rawData = data
    state.error = null
    
    // Mark step 1 as completed
    const step1 = steps.value.find(s => s.id === 1)
    if (step1) step1.completed = true
    
    saveState()
  }

  const setProcessedData = (data: ProcessedEmployeeData[]) => {
    state.processedData = data
    state.error = null
    
    // Mark step 2 and 3 as completed (since overview is just a review step)
    const step2 = steps.value.find(s => s.id === 2)
    const step3 = steps.value.find(s => s.id === 3)
    if (step2) step2.completed = true
    if (step3) step3.completed = true
    
    saveState()
  }

  const setError = (error: string) => {
    state.error = error
    state.isLoading = false
    saveState()
  }

  const setLoading = (loading: boolean) => {
    state.isLoading = loading
    if (!loading) saveState()
  }

  const goToStep = (stepId: number) => {
    if (stepId < 1 || stepId > steps.value.length) return false
    
    // Update current step
    steps.value.forEach(step => {
      step.current = step.id === stepId
    })
    
    state.currentStep = stepId
    saveState()
    return true
  }

  const goNext = () => {
    if (canGoNext.value && !isLastStep.value) {
      return goToStep(state.currentStep + 1)
    }
    return false
  }

  const goPrevious = () => {
    if (canGoPrevious.value) {
      return goToStep(state.currentStep - 1)
    }
    return false
  }

  const processEmployeesData = async () => {
    if (state.rawData.length === 0) {
      setError('No raw data to process')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await apiService.processEmployeesData(state.rawData)
      
      if (response.success && response.data) {
        // Transform API response to match our ProcessedEmployeeData interface
        const processedEmployees = response.data.employeesData.map(item => ({
          number: item.collaboratorObj.number,
          name: item.collaboratorObj.name,
          formattedDate: item.collaboratorObj.formattedDate,
          teamName: item.collaboratorObj.teamName,
          teamId: item.collaboratorObj.teamId,
          originalData: state.rawData.find(raw => raw.name === item.collaboratorObj.name) || {} as EmployeeData
        }))
        
        setProcessedData(processedEmployees)
        return true
      } else {
        setError(response.error || 'Failed to process employee data')
        return false
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }

  const setValidatedData = (data: any[]) => {
    state.validatedData = data
    state.error = null
    
    // Mark step 4 as completed
    const step4 = steps.value.find(s => s.id === 4)
    if (step4) step4.completed = true
    
    saveState()
  }

  const generateBirthdayMessages = async () => {
    if (state.validatedData.length === 0) {
      setError('No validated data to generate messages for')
      return false
    }

    // Mark generation as started
    state.generationStarted = true
    setLoading(true)
    setError('')

    try {
      const response = await apiService.generateBirthdayImages(state.validatedData)
      
      if (response.success && response.data && response.data.generationResult) {
        // Map the API response to our BirthdayMessage interface
        state.generatedMessages = response.data.generationResult.map(item => ({
          employeeId: item.number,
          employeeName: item.name,
          message: `Happy birthday ${item.name}! Wishing you a wonderful day on ${item.formattedDate}.`,
          imageUrl: item.imageURL,
          downloadUrl: item.downloadURL,
          generatedAt: new Date().toISOString(),
          teamName: item.teamName,
          formattedDate: item.formattedDate,
          generationStatus: item.generationStatus.status
        }))
        
        // Mark step 5 as completed
        const step5 = steps.value.find(s => s.id === 5)
        if (step5) step5.completed = true
        
        saveState()
        return true
      } else {
        setError(response.error || 'Failed to generate birthday messages')
        return false
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }

  const resetWorkflow = () => {
    Object.assign(state, {
      currentStep: 1,
      rawData: [],
      processedData: [],
      validatedData: [],
      generatedMessages: [],
      isLoading: false,
      error: null,
      generationStarted: false
    })

    steps.value.forEach((step, index) => {
      step.completed = false
      step.current = index === 0
    })

    sessionStorage.removeItem(STORAGE_KEY)
  }

  // Initialize
  loadState()

  return {
    state,
    steps,
    currentStepData,
    canGoNext,
    canGoPrevious,
    isFirstStep,
    isLastStep,
    setRawData,
    setProcessedData,
    setValidatedData,
    setError,
    setLoading,
    goToStep,
    goNext,
    goPrevious,
    processEmployeesData,
    generateBirthdayMessages,
    resetWorkflow
  }
}