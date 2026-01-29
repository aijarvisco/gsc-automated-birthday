<template>
  <Card>
    <CardHeader>
      <CardTitle>Step 4: Data Validation</CardTitle>
      <CardDescription>
        Review and correct employee information before generating birthday messages
      </CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent class="pt-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ totalEmployees }}</div>
              <div class="text-sm text-muted-foreground">Total Employees</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600">{{ employeesWithIssues }}</div>
              <div class="text-sm text-muted-foreground">Need Review</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ validEmployees }}</div>
              <div class="text-sm text-muted-foreground">Ready</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Actions Bar -->
      <div class="flex justify-between items-center mb-6">
        <div class="space-x-2">
          <Button 
            @click="validateAll" 
            variant="outline"
            :disabled="isValidating"
          >
            <CheckCircleIcon class="w-4 h-4 mr-2" />
            Validate All
          </Button>
          <Button 
            @click="resetValidation" 
            variant="outline"
            :disabled="isValidating"
          >
            <RefreshCwIcon class="w-4 h-4 mr-2" />
            Reset Changes
          </Button>
        </div>
        <div class="text-sm text-muted-foreground">
          {{ editedCount }} of {{ totalEmployees }} employees edited
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="flex gap-4 mb-6">
        <div class="flex-1">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Search employees..."
            class="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
          />
        </div>
        <select 
          v-model="statusFilter" 
          class="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-32"
        >
          <option value="all">All Status</option>
          <option value="valid">Valid</option>
          <option value="warning">Has Warnings</option>
          <option value="error">Has Errors</option>
          <option value="edited">Edited</option>
        </select>
      </div>

      <!-- Employee Data Table -->
      <div class="border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted/50 border-b">
              <tr>
                <th class="text-left p-3 font-medium text-sm">Status</th>
                <th class="text-left p-3 font-medium text-sm">Employee Number</th>
                <th class="text-left p-3 font-medium text-sm">Name</th>
                <th class="text-left p-3 font-medium text-sm">Team</th>
                <th class="text-left p-3 font-medium text-sm">Birthday</th>
                <th class="text-left p-3 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              <EmployeeValidationRow
                v-for="employee in filteredEmployees"
                :key="employee.number"
                :employee="employee"
                @update="updateEmployee"
                @validate="validateEmployee"
                @team-updated="handleTeamUpdated"
              />
            </tbody>
          </table>
        </div>
        
        <div v-if="filteredEmployees.length === 0" class="p-8 text-center text-muted-foreground">
          No employees match the current filters
        </div>
      </div>

      <!-- Validation Results Summary -->
      <div v-if="validationResults.length > 0" class="mt-6">
        <div class="flex items-center gap-2 mb-3">
          <AlertTriangleIcon class="w-5 h-5 text-orange-500" />
          <span class="font-medium">Validation Issues Found</span>
        </div>
        
        <div class="space-y-2 max-h-32 overflow-y-auto">
          <Alert 
            v-for="(result, index) in validationResults" 
            :key="index"
            :variant="result.type === 'error' ? 'destructive' : 'default'"
            class="py-2"
          >
            <AlertDescription class="text-sm">
              <strong>{{ result.employeeName }}:</strong> {{ result.message }}
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <!-- Final Validation & Submit -->
      <div class="mt-8 p-4 bg-muted/20 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium mb-1">Ready to Generate Messages?</h4>
            <p class="text-sm text-muted-foreground">
              All employee data has been reviewed. You can now generate personalized birthday messages.
            </p>
          </div>
          <Button 
            @click="proceedToGeneration"
            :disabled="!allDataValid || isValidating"
            class="gap-2"
          >
            Generate Messages
            <ArrowRightIcon class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { 
  CheckCircleIcon, 
  RefreshCwIcon, 
  AlertTriangleIcon, 
  ArrowRightIcon 
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Alert from '@/components/ui/Alert.vue'
import AlertDescription from '@/components/ui/AlertDescription.vue'
import Button from '@/components/ui/Button.vue'
import EmployeeValidationRow from './EmployeeValidationRow.vue'
import type { ProcessedEmployeeData, EmployeeValidation, ValidationStatus } from '@/types/employee'

interface ValidationResult {
  employeeName: string
  message: string
  type: 'warning' | 'error'
}

interface Props {
  processedData: ProcessedEmployeeData[]
  isLoading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null
})

const emit = defineEmits<{
  proceedToGeneration: [validatedData: EmployeeValidation[]]
}>()

const employees = ref<EmployeeValidation[]>([])
const searchTerm = ref('')
const statusFilter = ref('all')
const isValidating = ref(false)
const validationResults = ref<ValidationResult[]>([])

// Computed properties
const totalEmployees = computed(() => employees.value.length)

const employeesWithIssues = computed(() => 
  employees.value.filter(emp => 
    !emp.validation.isValid || emp.validation.warnings.length > 0
  ).length
)

const validEmployees = computed(() => 
  employees.value.filter(emp => emp.validation.isValid).length
)

const editedCount = computed(() => 
  employees.value.filter(emp => emp.isEdited).length
)

const allDataValid = computed(() => 
  employees.value.length > 0 && employees.value.every(emp => emp.validation.isValid)
)

const filteredEmployees = computed(() => {
  let filtered = employees.value

  // Apply search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(emp => 
      emp.name.toLowerCase().includes(term) ||
      emp.number.toLowerCase().includes(term) ||
      emp.teamName.toLowerCase().includes(term)
    )
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(emp => {
      switch (statusFilter.value) {
        case 'valid':
          return emp.validation.isValid
        case 'warning':
          return emp.validation.warnings.length > 0
        case 'error':
          return !emp.validation.isValid
        case 'edited':
          return emp.isEdited
        default:
          return true
      }
    })
  }

  return filtered
})

// Methods
const validateEmployee = (employee: EmployeeValidation): ValidationStatus => {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields validation
  if (!employee.name?.trim()) {
    errors.push('Name is required')
  }
  if (!employee.number?.trim()) {
    errors.push('Employee number is required')
  }
  if (!employee.formattedDate?.trim()) {
    errors.push('Birthday date is required')
  }
  if (!employee.teamName?.trim()) {
    warnings.push('Team name is missing')
  }

  // Birthday validation (basic presence check only)
  if (employee.formattedDate && employee.formattedDate.trim().length < 3) {
    warnings.push('Birthday date seems too short')
  }

  // Name validation (basic check for reasonable length)
  if (employee.name && (employee.name.length < 2 || employee.name.length > 100)) {
    warnings.push('Name length seems unusual')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

const updateEmployee = (updatedEmployee: EmployeeValidation) => {
  const index = employees.value.findIndex(emp => emp.number === updatedEmployee.number)
  if (index !== -1) {
    employees.value[index] = { 
      ...updatedEmployee, 
      isEdited: true,
      validation: validateEmployee(updatedEmployee)
    }
  }
}

const validateAll = () => {
  isValidating.value = true
  validationResults.value = []

  employees.value.forEach(employee => {
    employee.validation = validateEmployee(employee)
    
    // Collect validation issues for summary
    if (!employee.validation.isValid) {
      employee.validation.errors.forEach(error => {
        validationResults.value.push({
          employeeName: employee.name,
          message: error,
          type: 'error'
        })
      })
    }
    
    employee.validation.warnings.forEach(warning => {
      validationResults.value.push({
        employeeName: employee.name,
        message: warning,
        type: 'warning'
      })
    })
  })

  isValidating.value = false
}

const resetValidation = () => {
  // Reset to original processed data
  initializeEmployees()
  validationResults.value = []
}

const proceedToGeneration = () => {
  if (allDataValid.value) {
    emit('proceedToGeneration', employees.value)
  }
}

const initializeEmployees = () => {
  employees.value = props.processedData.map(emp => ({
    ...emp,
    validation: validateEmployee(emp as EmployeeValidation),
    isEdited: false
  }))
}

const handleTeamUpdated = (originalTeam: string, newTeam: string) => {
  // Update all employees with the same original team name
  employees.value.forEach(employee => {
    if (employee.teamName === originalTeam) {
      employee.teamName = newTeam
      employee.isEdited = true
      employee.validation = validateEmployee(employee)
    }
  })
}

// Provide employees list to child components
provide('allEmployees', employees)

// Initialize on mount
onMounted(() => {
  initializeEmployees()
  validateAll()
})
</script>