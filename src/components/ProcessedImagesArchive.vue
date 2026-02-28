<template>
  <div class="space-y-6">
    <!-- Header Card -->
    <Card>
      <CardHeader>
        <CardTitle>Processed Images Archive</CardTitle>
        <CardDescription>
          Browse all lifetime processed birthday images with advanced search and filtering
        </CardDescription>
      </CardHeader>
    </Card>

    <!-- Loading State -->
    <Card v-if="isLoading">
      <CardContent class="pt-6">
        <div class="text-center py-8">
          <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-muted-foreground">Loading processed images...</p>
        </div>
      </CardContent>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error">
      <CardContent class="pt-6">
        <Alert variant="destructive" class="mb-4">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
        <div class="text-center">
          <Button @click="loadCollaborators" class="gap-2">
            <RefreshCwIcon class="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="!isLoading && !error && collaborators.length === 0">
      <CardContent class="pt-6">
        <div class="text-center py-12">
          <div class="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <ImageIcon class="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 class="text-lg font-semibold mb-2">No Images Processed Yet</h3>
          <p class="text-muted-foreground mb-6 max-w-md mx-auto">
            No birthday images have been processed yet. Start by uploading employee data and generating birthday messages to see them appear here.
          </p>
          <Button @click="startProcessing" class="gap-2">
            <FileTextIcon class="w-4 h-4" />
            Start Processing Data
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Main Content -->
    <Card v-else>
      <CardContent class="pt-6">
        <div class="space-y-4">
          <!-- Search and Filters -->
          <div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <!-- Search Input -->
            <div class="flex-1 max-w-md">
              <div class="relative">
                <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  v-model="searchTerm"
                  type="text"
                  placeholder="Search by number, name, or team..."
                  class="pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm w-full"
                />
              </div>
            </div>
            
            <!-- Month Filter -->
            <div class="flex gap-2 items-center">
              <Select 
                v-model="selectedMonth"
                :options="monthOptions"
                placeholder="Select month..."
                class="min-w-[140px]"
              />
              
              <!-- Action Buttons -->
              <Button @click="exportData" variant="outline" size="sm" class="gap-2">
                <FileTextIcon class="w-4 h-4" />
                Export CSV
              </Button>

              <Button
                @click="downloadAllImages"
                variant="outline"
                size="sm"
                class="gap-2"
                :disabled="isDownloadingAll || filteredCollaborators.length === 0"
              >
                <DownloadIcon class="w-4 h-4" :class="{ 'animate-spin': isDownloadingAll }" />
                {{ isDownloadingAll ? `Downloading ${downloadAllProgress}...` : 'Download All' }}
              </Button>
              
              <Button @click="loadCollaborators" variant="outline" size="sm" class="gap-2">
                <RefreshCwIcon class="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          <!-- Results Summary -->
          <div class="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{{ filteredCollaborators.length }} of {{ collaborators.length }} images</span>
            <span>•</span>
            <span>{{ collaboratorsWithImages }} with valid images</span>
          </div>

          <!-- Table -->
          <div class="border rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-muted/50 border-b">
                  <tr>
                    <th class="text-left p-4 font-medium text-sm">Number</th>
                    <th class="text-left p-4 font-medium text-sm">Name</th>
                    <th class="text-left p-4 font-medium text-sm">Team</th>
                    <th class="text-left p-4 font-medium text-sm">Birthday Date</th>
                    <th class="text-left p-4 font-medium text-sm">Created At</th>
                    <th class="text-left p-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="collaborator in filteredCollaborators" 
                    :key="collaborator.id || Math.random()"
                    class="border-b hover:bg-muted/20 transition-colors"
                  >
                    <!-- Number -->
                    <td class="p-4">
                      <span class="font-mono text-sm">{{ collaborator.number }}</span>
                    </td>

                    <!-- Name -->
                    <td class="p-4">
                      <span class="font-medium">{{ collaborator.name }}</span>
                    </td>

                    <!-- Team -->
                    <td class="p-4">
                      <span class="text-sm">{{ collaborator.team || 'N/A' }}</span>
                    </td>

                    <!-- Birthday Date -->
                    <td class="p-4">
                      <span class="text-sm">{{ collaborator.birthday_date || 'N/A' }}</span>
                    </td>

                    <!-- Created At -->
                    <td class="p-4">
                      <span class="text-sm">{{ formatDate(collaborator.created_at) }}</span>
                    </td>

                    <!-- Actions -->
                    <td class="p-4">
                      <div class="flex gap-1">
                        <Button 
                          @click="viewImage(collaborator)"
                          variant="ghost" 
                          size="sm" 
                          class="h-8 w-8 p-0"
                          title="View image"
                          :disabled="!collaborator.image_url"
                        >
                          <EyeIcon class="w-4 h-4" />
                        </Button>
                        <Button 
                          @click="downloadImage(collaborator)"
                          variant="ghost" 
                          size="sm" 
                          class="h-8 w-8 p-0"
                          title="Download image"
                          :disabled="!collaborator.image_url || !collaborator.id || downloadingIds.has(collaborator.id.toString())"
                        >
                          <DownloadIcon class="w-4 h-4" :class="{ 'animate-spin': collaborator.id && downloadingIds.has(collaborator.id.toString()) }" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div v-if="filteredCollaborators.length === 0" class="p-8 text-center text-muted-foreground">
              No images match your search criteria
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import JSZip from 'jszip'
import { 
  SearchIcon, 
  DownloadIcon, 
  FileTextIcon, 
  EyeIcon,
  RefreshCwIcon,
  ImageIcon
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Alert from '@/components/ui/Alert.vue'
import AlertDescription from '@/components/ui/AlertDescription.vue'
import Select from '@/components/ui/Select.vue'
import type { LifetimeCollaborator } from '@/types/employee'
import apiService from '@/services/api'

// Define emits
const emit = defineEmits<{
  navigateToWorkflow: []
}>()

// Reactive state
const collaborators = ref<LifetimeCollaborator[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const searchTerm = ref('')
const selectedMonth = ref('')
const downloadingIds = ref<Set<string>>(new Set())
const isDownloadingAll = ref(false)
const downloadAllProgress = ref('')

// Month options for filtering
const monthOptions = [
  { value: '', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
]

// Computed properties
const filteredCollaborators = computed(() => {
  // Ensure we have a valid array
  if (!Array.isArray(collaborators.value)) {
    console.warn('Collaborators is not an array:', collaborators.value)
    return []
  }

  let filtered = [...collaborators.value]

  // Apply text search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(collaborator => 
      collaborator.name.toLowerCase().includes(term) ||
      collaborator.number.toLowerCase().includes(term) ||
      (collaborator.team && collaborator.team.toLowerCase().includes(term))
    )
  }

  // Apply month filter
  if (selectedMonth.value) {
    filtered = filtered.filter(collaborator => {
      if (!collaborator.birthday_date) return false
      
      // Extract month from birthday_date (format: "DD de Mês")
      const monthNames: { [key: string]: string } = {
        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
        'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
        'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
      }
      
      const birthdayMonth = collaborator.birthday_date.toLowerCase()
      for (const [monthName, monthNumber] of Object.entries(monthNames)) {
        if (birthdayMonth.includes(monthName) && selectedMonth.value === monthNumber) {
          return true
        }
      }
      return false
    })
  }

  // Sort by created_at (most recent first)
  return filtered.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
})

const collaboratorsWithImages = computed(() => 
  Array.isArray(collaborators.value) ? collaborators.value.filter(c => c.image_url).length : 0
)

// Methods
const loadCollaborators = async () => {
  isLoading.value = true
  error.value = null

  try {
    const response = await apiService.getAllCollaborators()
    console.log('API Response:', response)
    
    if (response.success && response.data) {
      // Handle the expected response structure: { collaborators: [...] }
      if (response.data.collaborators && Array.isArray(response.data.collaborators)) {
        // Filter out empty objects and validate required fields
        const validCollaborators = response.data.collaborators.filter(collaborator => 
          collaborator && 
          typeof collaborator === 'object' && 
          collaborator.id !== undefined && 
          collaborator.name && 
          collaborator.number
        )
        collaborators.value = validCollaborators
      } else if (Array.isArray(response.data)) {
        // Fallback for direct array response
        const validCollaborators = response.data.filter(collaborator => 
          collaborator && 
          typeof collaborator === 'object' && 
          collaborator.id !== undefined && 
          collaborator.name && 
          collaborator.number
        )
        collaborators.value = validCollaborators
      } else {
        console.warn('API returned unexpected data structure:', response.data)
        collaborators.value = []
        error.value = 'Invalid data format received from server'
      }
    } else {
      error.value = response.error || 'Failed to load collaborators'
    }
  } catch (err) {
    error.value = 'Network error. Please check your connection and try again.'
    console.error('Error loading collaborators:', err)
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

const viewImage = (collaborator: LifetimeCollaborator) => {
  if (!collaborator.image_url) return
  window.open(collaborator.image_url, '_blank')
}

const downloadImage = async (collaborator: LifetimeCollaborator) => {
  if (!collaborator.image_url || !collaborator.id) return
  
  const collaboratorId = collaborator.id.toString()
  downloadingIds.value.add(collaboratorId)
  
  try {
    // For Google Drive URLs, we'll open in new tab as direct download might not work
    if (collaborator.image_url.includes('drive.google.com')) {
      window.open(collaborator.image_url, '_blank')
    } else {
      // For direct image URLs, attempt proper download
      const response = await fetch(collaborator.image_url)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `birthday-${collaborator.name.replace(/\s+/g, '-')}-${collaborator.number}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(blobUrl)
    }
  } catch (error) {
    console.error('Download failed:', error)
    // Fallback: try opening in new tab
    window.open(collaborator.image_url, '_blank')
  } finally {
    downloadingIds.value.delete(collaboratorId)
  }
}

const getDirectImageUrl = (url: string): string => {
  // Convert Google Drive view URLs to direct image URLs
  const driveMatch = url.match(/\/file\/d\/([^/]+)/)
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  }
  return url
}

const getBirthdayDay = (birthdayDate: string): string => {
  // Extract day from "DD de Mês" format
  const match = birthdayDate?.match(/^(\d{1,2})/)
  return match ? match[1].padStart(2, '0') : '00'
}

const downloadAllImages = async () => {
  const withImages = filteredCollaborators.value.filter(c => c.image_url)
  if (withImages.length === 0) return

  isDownloadingAll.value = true
  downloadAllProgress.value = `0/${withImages.length}`

  const zip = new JSZip()
  let downloaded = 0

  for (const collaborator of withImages) {
    try {
      const directUrl = getDirectImageUrl(collaborator.image_url)
      const response = await fetch(directUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const blob = await response.blob()
      // Validate that we actually got an image
      if (!blob.type.startsWith('image/')) {
        throw new Error(`Received ${blob.type} instead of image`)
      }

      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      const day = getBirthdayDay(collaborator.birthday_date)
      const name = collaborator.name.replace(/\s+/g, '_')
      const team = (collaborator.team || 'NO-TEAM').replace(/\s+/g, '_')
      const filename = `${day}_${name}_${team}.${ext}`
      zip.file(filename, blob)
    } catch (err) {
      console.warn(`Failed to download image for ${collaborator.name}:`, err)
    }

    downloaded++
    downloadAllProgress.value = `${downloaded}/${withImages.length}`
  }

  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(zipBlob)
    link.download = `birthday-images-${new Date().toISOString().split('T')[0]}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  } catch (err) {
    console.error('Failed to generate ZIP:', err)
  } finally {
    isDownloadingAll.value = false
  }
}

const exportData = () => {
  const csvContent = [
    ['ID', 'Number', 'Name', 'Team', 'Birthday Date', 'Image URL', 'Created At'],
    ...filteredCollaborators.value.map(c => [
      c.id ? c.id.toString() : 'N/A',
      c.number || 'N/A',
      c.name || 'N/A',
      c.team || '',
      c.birthday_date || '',
      c.image_url || '',
      c.created_at || ''
    ])
  ].map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')).join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `processed-images-archive-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

const startProcessing = () => {
  emit('navigateToWorkflow')
}

// Load data on component mount
onMounted(() => {
  loadCollaborators()
})
</script>