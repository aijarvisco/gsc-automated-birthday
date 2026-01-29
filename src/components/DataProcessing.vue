<template>
  <div class="space-y-6">
    <!-- Processing Status -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <LoaderIcon v-if="isLoading" class="w-5 h-5 animate-spin" />
          <CheckIcon v-else-if="isCompleted" class="w-5 h-5 text-green-600" />
          <DatabaseIcon v-else class="w-5 h-5" />
          Data Processing
        </CardTitle>
        <CardDescription>
          Processing {{ rawDataCount }} employee records and enriching with team assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <!-- Raw Records Table -->
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Raw records uploaded:</span>
              <span class="font-medium">{{ rawDataCount }}</span>
            </div>
            
            <!-- Raw Data Preview Table -->
            <div v-if="rawDataCount > 0" class="border rounded-lg overflow-hidden">
              <div class="max-h-48 overflow-y-auto">
                <table class="w-full text-sm">
                  <thead class="bg-muted/50 sticky top-0">
                    <tr class="border-b">
                      <th class="text-left p-2 font-medium">Name</th>
                      <th class="text-left p-2 font-medium">Birth Date</th>
                      <th class="text-left p-2 font-medium">Start Date</th>
                      <th class="text-left p-2 font-medium">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="(record, index) in rawDataPreview" 
                      :key="index"
                      class="border-b hover:bg-muted/20 transition-colors"
                    >
                      <td class="p-2 font-medium">{{ record.name || record.Nome || 'N/A' }}</td>
                      <td class="p-2">{{ formatRawDate(record['Data Nascimento']) }}</td>
                      <td class="p-2">{{ formatRawDate(record['Início Atividade']) }}</td>
                      <td class="p-2">{{ record.team || record.Equipa || record.Team || 'N/A' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div v-if="processedDataCount > 0" class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Records processed:</span>
            <span class="font-medium text-green-600">{{ processedDataCount }}</span>
          </div>

          <!-- Processing Actions -->
          <div class="flex gap-3 pt-4">
            <Button 
              @click="startProcessing"
              :disabled="isLoading || isCompleted || rawDataCount === 0"
              class="flex-1"
            >
              <LoaderIcon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
              <PlayIcon v-else-if="!isCompleted" class="w-4 h-4 mr-2" />
              <CheckIcon v-else class="w-4 h-4 mr-2" />
              {{ getButtonText }}
            </Button>

            <Button 
              v-if="isCompleted" 
              @click="reprocess"
              variant="outline"
              :disabled="isLoading"
            >
              <RefreshCwIcon class="w-4 h-4 mr-2" />
              Reprocess
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Error Display -->
    <Alert v-if="error" variant="destructive">
      <AlertTriangleIcon class="w-4 h-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Processing Results Preview -->
    <Card v-if="processedDataCount > 0">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <UsersIcon class="w-5 h-5" />
          Processing Results
        </CardTitle>
        <CardDescription>
          Preview of processed employee data (showing first 5 records)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div 
            v-for="(employee, index) in previewData" 
            :key="employee.id || index"
            class="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
          >
            <div class="flex flex-col">
              <span class="font-medium">{{ employee.name }}</span>
              <div class="flex gap-4 text-sm text-muted-foreground">
                <span>ID: {{ employee.number }}</span>
                <span>Team: {{ employee.teamName }}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm text-muted-foreground">Birthday</div>
              <div class="text-sm font-medium">{{ employee.formattedDate }}</div>
            </div>
          </div>

          <div v-if="processedDataCount > 5" class="text-center text-sm text-muted-foreground pt-2 border-t">
            And {{ processedDataCount - 5 }} more records...
          </div>
        </div>
      </CardContent>
    </Card>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  LoaderIcon, 
  CheckIcon, 
  DatabaseIcon, 
  PlayIcon, 
  RefreshCwIcon,
  AlertTriangleIcon,
  UsersIcon
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Alert from '@/components/ui/Alert.vue'
import AlertDescription from '@/components/ui/AlertDescription.vue'

const emit = defineEmits<{
  proceedToNext: []
}>()

const props = defineProps<{
  rawDataCount: number
  rawData: any[]
  processedDataCount: number
  processedData: any[]
  isLoading: boolean
  error: string | null
}>()

const isCompleted = computed(() => props.processedDataCount > 0 && !props.isLoading)

const rawDataPreview = computed(() => props.rawData)

const previewData = computed(() => props.processedData.slice(0, 5))

const getButtonText = computed(() => {
  if (props.isLoading) return 'Processing'
  if (isCompleted.value) return 'Processing Complete'
  return 'Start Processing'
})

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

const formatRawDate = (dateValue: any) => {
  if (!dateValue) return 'N/A'
  
  try {
    // Handle ISO string dates
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleDateString()
    }
    // Handle Date objects
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString()
    }
    // Handle Excel serial numbers (if any remain)
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - 25569) * 86400 * 1000)
      return date.toLocaleDateString()
    }
    
    return String(dateValue)
  } catch {
    return 'Invalid Date'
  }
}

const startProcessing = () => {
  emit('proceedToNext')
}

const reprocess = () => {
  emit('proceedToNext')
}
</script>