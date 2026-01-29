<template>
  <div class="space-y-6">
    <!-- Overview Summary -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <ClipboardCheckIcon class="w-5 h-5" />
          Data Processing Complete
        </CardTitle>
        <CardDescription>
          Review the processed employee data before proceeding to validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-muted/30 rounded-lg">
            <div class="text-2xl font-bold text-primary">{{ processedData.length }}</div>
            <div class="text-sm text-muted-foreground">Total Records</div>
          </div>
          <div class="text-center p-4 bg-muted/30 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ uniqueTeams.length }}</div>
            <div class="text-sm text-muted-foreground">Teams</div>
          </div>
          <div class="text-center p-4 bg-muted/30 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ uniqueDepartments.length }}</div>
            <div class="text-sm text-muted-foreground">Departments</div>
          </div>
          <div class="text-center p-4 bg-muted/30 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{{ upcomingBirthdays.length }}</div>
            <div class="text-sm text-muted-foreground">This Month</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Data Table -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="flex items-center gap-2">
              <TableIcon class="w-5 h-5" />
              Employee Data
            </CardTitle>
            <CardDescription>
              Processed employee records with enriched information
            </CardDescription>
          </div>
          <div class="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              @click="exportData"
            >
              <DownloadIcon class="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <!-- Search and Filter -->
          <div class="flex gap-4">
            <div class="flex-1">
              <input
                v-model="searchTerm"
                placeholder="Search employees..."
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <select 
              v-model="selectedTeam"
              class="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Teams</option>
              <option v-for="team in uniqueTeams" :key="team" :value="team">
                {{ team }}
              </option>
            </select>
          </div>

          <!-- Data Table -->
          <div class="border rounded-lg overflow-hidden">
            <div class="max-h-96 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="bg-muted/50 sticky top-0">
                  <tr class="border-b">
                    <th class="text-left p-3 font-medium">Employee ID</th>
                    <th class="text-left p-3 font-medium">Name</th>
                    <th class="text-left p-3 font-medium">Team</th>
                    <th class="text-left p-3 font-medium">Birthday</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(employee, index) in filteredData" 
                    :key="employee.id || index"
                    class="border-b hover:bg-muted/20 transition-colors"
                  >
                    <td class="p-3 font-medium">{{ employee.number }}</td>
                    <td class="p-3 font-medium">{{ employee.name }}</td>
                    <td class="p-3">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {{ employee.teamName }}
                      </span>
                    </td>
                    <td class="p-3">
                      <div class="flex items-center gap-2">
                        <span>{{ employee.formattedDate }}</span>
                        <CalendarIcon 
                          v-if="isUpcomingBirthday(employee.formattedDate)"
                          class="w-3 h-3 text-yellow-500"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Results Count -->
          <div class="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {{ filteredData.length }} of {{ processedData.length }} employees
            </span>
            <span v-if="searchTerm || selectedTeam">
              <Button variant="ghost" size="sm" @click="clearFilters">
                Clear Filters
              </Button>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Next Steps -->
    <Card>
      <CardHeader>
        <CardTitle>Ready for Validation</CardTitle>
        <CardDescription>
          The data has been processed successfully. You can now proceed to human validation where you can review and correct any team assignments or employee information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex gap-3">
          <Button @click="proceedToValidation" class="gap-2">
            <UserCheckIcon class="w-4 h-4" />
            Proceed to Validation
          </Button>
          <Button variant="outline" @click="reprocessData">
            <RefreshCwIcon class="w-4 h-4 mr-2" />
            Reprocess Data
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ClipboardCheckIcon,
  TableIcon,
  DownloadIcon,
  CalendarIcon,
  UserCheckIcon,
  RefreshCwIcon
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import type { ProcessedEmployeeData } from '@/types/employee'

const emit = defineEmits<{
  proceedToValidation: []
  reprocessData: []
}>()

const props = defineProps<{
  processedData: ProcessedEmployeeData[]
}>()

const searchTerm = ref('')
const selectedTeam = ref('')

const uniqueTeams = computed(() => {
  const teams = new Set(props.processedData.map(emp => emp.teamName).filter(Boolean))
  return Array.from(teams).sort()
})

const uniqueDepartments = computed(() => {
  // Since we don't have department in new format, we'll use teams as departments for now
  const departments = new Set(props.processedData.map(emp => emp.teamName).filter(Boolean))
  return Array.from(departments).sort()
})

const upcomingBirthdays = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  
  return props.processedData.filter(emp => {
    try {
      // Parse formattedDate which is like "03 de Janeiro"
      const months = {
        'Janeiro': 0, 'Fevereiro': 1, 'Março': 2, 'Abril': 3,
        'Maio': 4, 'Junho': 5, 'Julho': 6, 'Agosto': 7,
        'Setembro': 8, 'Outubro': 9, 'Novembro': 10, 'Dezembro': 11
      }
      
      const monthName = emp.formattedDate.split(' de ')[1]
      const monthIndex = months[monthName as keyof typeof months]
      
      return monthIndex === currentMonth
    } catch {
      return false
    }
  })
})

const filteredData = computed(() => {
  let filtered = props.processedData

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(emp => 
      emp.name.toLowerCase().includes(term) ||
      emp.number.toLowerCase().includes(term) ||
      emp.teamName.toLowerCase().includes(term) ||
      emp.formattedDate.toLowerCase().includes(term)
    )
  }

  if (selectedTeam.value) {
    filtered = filtered.filter(emp => emp.teamName === selectedTeam.value)
  }

  return filtered
})

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

const isUpcomingBirthday = (formattedDate: string) => {
  try {
    // Parse formattedDate which is like "03 de Janeiro"
    const months = {
      'Janeiro': 0, 'Fevereiro': 1, 'Março': 2, 'Abril': 3,
      'Maio': 4, 'Junho': 5, 'Julho': 6, 'Agosto': 7,
      'Setembro': 8, 'Outubro': 9, 'Novembro': 10, 'Dezembro': 11
    }
    
    const monthName = formattedDate.split(' de ')[1]
    const monthIndex = months[monthName as keyof typeof months]
    const now = new Date()
    const currentMonth = now.getMonth()
    
    return monthIndex === currentMonth
  } catch {
    return false
  }
}

const clearFilters = () => {
  searchTerm.value = ''
  selectedTeam.value = ''
}

const exportData = () => {
  const csvContent = [
    ['Employee ID', 'Name', 'Team', 'Birthday'],
    ...props.processedData.map(emp => [
      emp.number,
      emp.name,
      emp.teamName,
      emp.formattedDate
    ])
  ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `processed-employee-data-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const proceedToValidation = () => {
  emit('proceedToValidation')
}

const reprocessData = () => {
  emit('reprocessData')
}
</script>