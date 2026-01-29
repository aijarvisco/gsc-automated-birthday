<template>
  <div class="space-y-4">
    <div
      ref="dropZone"
      @click="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      :class="[
        'border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300',
        isDragOver
          ? 'border-primary bg-primary/10'
          : 'border-border bg-muted/20 hover:border-primary hover:bg-primary/5'
      ]"
    >
      <div class="text-4xl mb-4">📁</div>
      <p class="text-lg text-foreground mb-2">
        Drag & drop your file here or <span class="text-primary underline">browse</span>
      </p>
      <p class="text-sm text-muted-foreground">
        Accepted formats: .xlsx, .csv
      </p>
    </div>
    
    <input
      ref="fileInput"
      type="file"
      accept=".xlsx,.csv"
      @change="handleFileChange"
      class="hidden"
    >
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as XLSX from 'xlsx'

const emit = defineEmits<{
  fileProcessed: [data: any[]]
  statusChange: [message: string, type: 'info' | 'success' | 'error']
  progressUpdate: [value: number, text: string]
}>()

const dropZone = ref<HTMLDivElement>()
const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    handleFile(files[0])
  }
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    handleFile(target.files[0])
  }
}

const handleFile = (file: File) => {
  const validExtensions = ['.xlsx', '.csv']
  const fileName = file.name.toLowerCase()
  const isValid = validExtensions.some(ext => fileName.endsWith(ext))

  if (!isValid) {
    emit('statusChange', 'Invalid file type. Please upload an .xlsx or .csv file.', 'error')
    return
  }

  emit('statusChange', `Processing: ${file.name}`, 'info')
  emit('progressUpdate', 0, '')

  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })

      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]

      const jsonData = XLSX.utils.sheet_to_json(sheet)

      if (jsonData.length === 0) {
        emit('statusChange', 'The file appears to be empty.', 'error')
        return
      }

      const dateFields = ['Data Nascimento', 'Início Atividade']
      const processedData = jsonData.map(row => {
        const newRow = { ...row }
        dateFields.forEach(field => {
          if (newRow[field]) {
            if (newRow[field] instanceof Date) {
              newRow[field] = newRow[field].toISOString()
            } else if (typeof newRow[field] === 'number') {
              const date = new Date((newRow[field] - 25569) * 86400 * 1000)
              newRow[field] = date.toISOString()
            }
          }
        })
        return newRow
      })

      emit('statusChange', `Found ${processedData.length} rows. Sending to API...`, 'info')
      emit('fileProcessed', processedData)
    } catch (error) {
      emit('statusChange', `Error processing file: ${(error as Error).message}`, 'error')
    }
  }

  reader.onerror = () => {
    emit('statusChange', 'Error reading file.', 'error')
  }

  reader.readAsArrayBuffer(file)
}
</script>