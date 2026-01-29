<template>
  <div class="space-y-4">
    <!-- Search and Filters -->
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="flex-1 max-w-md">
        <div class="relative">
          <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Search employees..."
            class="pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm w-full"
          />
        </div>
      </div>
      
      <div class="flex gap-2">
        <Button @click="downloadAll" variant="outline" size="sm" class="gap-2" :disabled="isDownloadingAll">
          <DownloadIcon class="w-4 h-4" />
          {{ isDownloadingAll ? 'Downloading...' : 'Download All' }}
        </Button>
        <Button @click="exportData" variant="outline" size="sm" class="gap-2">
          <FileTextIcon class="w-4 h-4" />
          Export CSV
        </Button>
      </div>
    </div>

    <!-- Results Summary -->
    <div class="flex items-center gap-4 text-sm text-muted-foreground">
      <span>{{ filteredMessages.length }} of {{ messages.length }} messages</span>
      <span>•</span>
      <span>{{ messagesWithImages }} with images</span>
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
              <th class="text-left p-4 font-medium text-sm">Generation Date</th>
              <th class="text-left p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="message in filteredMessages" 
              :key="message.employeeId"
              class="border-b hover:bg-muted/20 transition-colors"
            >
              <!-- Number -->
              <td class="p-4">
                <span class="font-mono text-sm">{{ message.employeeId }}</span>
              </td>

              <!-- Name -->
              <td class="p-4">
                <span class="font-medium">{{ message.employeeName }}</span>
              </td>

              <!-- Team -->
              <td class="p-4">
                <span class="text-sm">{{ message.teamName || 'N/A' }}</span>
              </td>

              <!-- Generation Date -->
              <td class="p-4">
                <span class="text-sm">{{ formatDate(message.generatedAt) }}</span>
              </td>

              <!-- Actions -->
              <td class="p-4">
                <div class="flex gap-1">
                  <Button 
                    @click="viewImage(message)"
                    variant="ghost" 
                    size="sm" 
                    class="h-8 w-8 p-0"
                    title="View image"
                    :disabled="!message.imageUrl"
                  >
                    <EyeIcon class="w-4 h-4" />
                  </Button>
                  <Button 
                    @click="downloadImage(message)"
                    variant="ghost" 
                    size="sm" 
                    class="h-8 w-8 p-0"
                    title="Download image"
                    :disabled="!message.downloadUrl || downloadingIds.has(message.employeeId)"
                  >
                    <DownloadIcon class="w-4 h-4" :class="{ 'animate-spin': downloadingIds.has(message.employeeId) }" />
                  </Button>
                  <Button 
                    @click="shareMessage(message)"
                    variant="ghost" 
                    size="sm" 
                    class="h-8 w-8 p-0"
                    title="Share image"
                    :disabled="!message.imageUrl"
                  >
                    <ShareIcon class="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="filteredMessages.length === 0" class="p-8 text-center text-muted-foreground">
        No messages match your search criteria
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  SearchIcon, 
  DownloadIcon, 
  FileTextIcon, 
  EyeIcon, 
  ShareIcon 
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import type { BirthdayMessage } from '@/types/employee'

interface Props {
  messages: BirthdayMessage[]
}

const props = defineProps<Props>()

const searchTerm = ref('')
const isDownloadingAll = ref(false)
const downloadingIds = ref<Set<string>>(new Set())

// Computed properties
const filteredMessages = computed(() => {
  if (!searchTerm.value) return props.messages
  
  const term = searchTerm.value.toLowerCase()
  return props.messages.filter(message => 
    message.employeeName.toLowerCase().includes(term) ||
    message.employeeId.toLowerCase().includes(term) ||
    (message.teamName && message.teamName.toLowerCase().includes(term))
  )
})

const messagesWithImages = computed(() => 
  props.messages.filter(m => m.imageUrl).length
)

// Methods
const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

const viewImage = (message: BirthdayMessage) => {
  if (!message.imageUrl) return
  window.open(message.imageUrl, '_blank')
}


const downloadImage = async (message: BirthdayMessage) => {
  if (!message.downloadUrl) return
  
  // Add to downloading set
  downloadingIds.value.add(message.employeeId)
  
  try {
    // Fetch the image as a blob
    const response = await fetch(message.downloadUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    
    // Create a temporary URL for the blob
    const blobUrl = URL.createObjectURL(blob)
    
    // Create and trigger download
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `birthday-${message.employeeName.replace(/\s+/g, '-')}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Download failed:', error)
    // Fallback: try opening in new tab
    window.open(message.downloadUrl, '_blank')
  } finally {
    // Remove from downloading set
    downloadingIds.value.delete(message.employeeId)
  }
}

const shareMessage = async (message: BirthdayMessage) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Birthday Message for ${message.employeeName}`,
        text: message.message,
        url: message.imageUrl
      })
    } catch (error) {
      console.error('Failed to share:', error)
    }
  }
}

const downloadAll = async () => {
  const messagesWithDownloadUrls = props.messages.filter(m => m.downloadUrl)
  
  if (messagesWithDownloadUrls.length === 0) return
  
  isDownloadingAll.value = true
  
  try {
    for (let i = 0; i < messagesWithDownloadUrls.length; i++) {
      try {
        await downloadImage(messagesWithDownloadUrls[i])
        // Small delay between downloads to prevent overwhelming the browser
        if (i < messagesWithDownloadUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Failed to download image for ${messagesWithDownloadUrls[i].employeeName}:`, error)
      }
    }
  } finally {
    isDownloadingAll.value = false
  }
}

const exportData = () => {
  const csvContent = [
    ['Employee Name', 'Employee ID', 'Message', 'Image URL', 'Download URL', 'Generated At'],
    ...props.messages.map(m => [
      m.employeeName,
      m.employeeId,
      `"${m.message?.replace(/"/g, '""') || ''}"`,
      m.imageUrl || '',
      m.downloadUrl || '',
      m.generatedAt
    ])
  ].map(row => row.join(',')).join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `birthday-messages-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>