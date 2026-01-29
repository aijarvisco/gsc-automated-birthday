<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-400 via-[#0082ca] to-blue-700 p-5">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">
          {{ currentPage === 'workflow' ? 'Birthday Messages Workflow' : 'Teams Management' }}
        </h1>
        <p class="text-blue-100">
          {{ currentPage === 'workflow' ? 'Process employee data and generate personalized birthday content' : 'Manage team name mappings and standardization' }}
        </p>
      </div>

      <!-- Navigation -->
      <Navigation 
        :current-page="currentPage"
        @page-change="handlePageChange"
      />

      <!-- Step Indicator (only for workflow) -->
      <div v-if="currentPage === 'workflow'" class="mb-8">
        <Card>
          <CardContent class="pt-6">
            <StepIndicator :steps="steps" />
          </CardContent>
        </Card>
      </div>

      <!-- Main Content -->
      <div class="space-y-6">
        <!-- Teams Management Page -->
        <div v-if="currentPage === 'teams'">
          <TeamsManagement />
        </div>

        <!-- Workflow Content -->
        <div v-else-if="currentPage === 'workflow'">
          <!-- Step 1: Data Upload -->
          <Card v-if="state.currentStep === 1">
          <CardHeader>
            <CardTitle>Step 1: Data Upload</CardTitle>
            <CardDescription>
              Upload your employee data file to begin the birthday message workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              @file-processed="handleFileProcessed"
              @status-change="handleStatusChange"
              @progress-update="handleProgressUpdate"
            />
            
            <Alert v-if="status.message" :variant="status.type === 'error' ? 'destructive' : 'default'" class="mt-4">
              <AlertDescription>{{ status.message }}</AlertDescription>
            </Alert>

            <div v-if="showProgress" class="mt-4 space-y-2">
              <Progress :model-value="progress" />
              <p class="text-sm text-muted-foreground text-center">{{ progressText }}</p>
            </div>

            <!-- Navigation -->
            <div v-if="canGoNext" class="flex justify-end mt-6">
              <Button @click="goNext" class="gap-2">
                Next: Process Data
                <ArrowRightIcon class="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Step 2: Data Processing -->
        <div v-else-if="state.currentStep === 2">
          <DataProcessing
            :raw-data-count="state.rawData.length"
            :raw-data="state.rawData"
            :processed-data-count="state.processedData.length"
            :processed-data="state.processedData"
            :is-loading="state.isLoading"
            :error="state.error"
            @proceed-to-next="handleDataProcessing"
          />

          <!-- Navigation -->
          <Card class="mt-6">
            <CardContent class="pt-6">
              <div class="flex justify-between">
                <Button @click="goPrevious" variant="outline" class="gap-2">
                  <ArrowLeftIcon class="w-4 h-4" />
                  Back: Upload Data
                </Button>
                <Button 
                  v-if="state.processedData.length > 0" 
                  @click="goNext" 
                  class="gap-2"
                >
                  Next: Review Data
                  <ArrowRightIcon class="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Step 3: Data Overview -->
        <div v-else-if="state.currentStep === 3">
          <DataProcessedOverview
            :processed-data="state.processedData"
            @proceed-to-validation="handleProceedToValidation"
            @reprocess-data="handleReprocessData"
          />

          <!-- Navigation -->
          <Card class="mt-6">
            <CardContent class="pt-6">
              <div class="flex justify-between">
                <Button @click="goPrevious" variant="outline" class="gap-2">
                  <ArrowLeftIcon class="w-4 h-4" />
                  Back: Processing
                </Button>
                <div class="flex gap-3">
                  <Button @click="resetWorkflow" variant="outline">
                    <RefreshCwIcon class="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                  <Button @click="handleProceedToValidation" class="gap-2">
                    Continue to Validation
                    <ArrowRightIcon class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Step 4: Data Validation -->
        <div v-else-if="state.currentStep === 4">
          <DataValidation
            :processed-data="state.processedData"
            :is-loading="state.isLoading"
            :error="state.error"
            @proceed-to-generation="handleProceedToGeneration"
          />

          <!-- Navigation -->
          <Card class="mt-6">
            <CardContent class="pt-6">
              <div class="flex justify-between">
                <Button @click="goPrevious" variant="outline" class="gap-2">
                  <ArrowLeftIcon class="w-4 h-4" />
                  Back: Overview
                </Button>
                <div class="flex gap-3">
                  <Button @click="resetWorkflow" variant="outline">
                    <RefreshCwIcon class="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Step 5: Message Generation -->
        <div v-else-if="state.currentStep === 5">
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Generate Messages</CardTitle>
              <CardDescription>
                Generate personalized birthday messages and images for {{ state.validatedData.length }} employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <!-- Loading State -->
              <div v-if="state.isLoading" class="text-center py-8">
                <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="text-muted-foreground mb-2">Generating birthday messages and images for {{ state.validatedData.length }} employees...</p>
                <p class="text-xs text-muted-foreground">This may take a few minutes, please wait...</p>
              </div>

              <!-- Error State -->
              <div v-else-if="state.error" class="text-center py-8">
                <Alert variant="destructive" class="mb-4">
                  <AlertDescription>{{ state.error }}</AlertDescription>
                </Alert>
                <Button @click="handleGenerateMessages" class="gap-2">
                  <RefreshCwIcon class="w-4 h-4" />
                  Try Again
                </Button>
              </div>

              <!-- Success State with Results Table -->
              <div v-else-if="state.generatedMessages.length > 0" class="space-y-6">
                <Alert>
                  <AlertDescription>
                    ✅ Successfully generated {{ state.generatedMessages.length }} birthday messages!
                  </AlertDescription>
                </Alert>
                
                <GeneratedMessagesTable :messages="state.generatedMessages" />
                
                <div class="text-center pt-4">
                  <Button @click="resetWorkflow" class="gap-2">
                    <RefreshCwIcon class="w-4 h-4" />
                    Start New Workflow
                  </Button>
                </div>
              </div>

              <!-- Initial State - Only show if generation hasn't started -->
              <div v-else-if="!state.generationStarted" class="text-center py-8">
                <div class="mb-6">
                  <div class="text-4xl mb-4">🎉</div>
                  <h3 class="text-lg font-semibold mb-2">Ready to Generate Birthday Messages</h3>
                  <p class="text-muted-foreground mb-4">
                    We'll create personalized birthday messages and images for {{ state.validatedData.length }} employees
                  </p>
                </div>
                <Button @click="handleGenerateMessages" size="lg" class="gap-2">
                  <ArrowRightIcon class="w-4 h-4" />
                  Generate {{ state.validatedData.length }} Messages
                </Button>
              </div>

              <!-- Waiting State - After generation started but before completion -->
              <div v-else class="text-center py-8">
                <div class="animate-pulse">
                  <div class="text-2xl mb-4">⏳</div>
                  <p class="text-muted-foreground">Generation started, please wait...</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Navigation -->
          <Card class="mt-6">
            <CardContent class="pt-6">
              <div class="flex justify-between">
                <Button @click="goPrevious" variant="outline" class="gap-2">
                  <ArrowLeftIcon class="w-4 h-4" />
                  Back: Validation
                </Button>
                <Button @click="resetWorkflow" variant="outline">
                  <RefreshCwIcon class="w-4 h-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ArrowRightIcon, ArrowLeftIcon, RefreshCwIcon } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Progress from '@/components/ui/Progress.vue'
import Alert from '@/components/ui/Alert.vue'
import AlertDescription from '@/components/ui/AlertDescription.vue'
import Button from '@/components/ui/Button.vue'
import FileUpload from '@/components/FileUpload.vue'
import StepIndicator from '@/components/StepIndicator.vue'
import DataProcessing from '@/components/DataProcessing.vue'
import DataProcessedOverview from '@/components/DataProcessedOverview.vue'
import DataValidation from '@/components/DataValidation.vue'
import Navigation from '@/components/Navigation.vue'
import TeamsManagement from '@/components/TeamsManagement.vue'
import GeneratedMessagesTable from '@/components/GeneratedMessagesTable.vue'
import { useWorkflow } from '@/composables/useWorkflow'
import type { EmployeeData, EmployeeValidation } from '@/types/employee'

const {
  state,
  steps,
  canGoNext,
  canGoPrevious,
  setRawData,
  setValidatedData,
  goNext,
  goPrevious,
  goToStep,
  processEmployeesData,
  generateBirthdayMessages,
  resetWorkflow
} = useWorkflow()

const status = reactive({
  message: '',
  type: 'info' as 'info' | 'success' | 'error'
})

const progress = ref(0)
const progressText = ref('')
const showProgress = ref(false)

// Page navigation state
const currentPage = ref<'workflow' | 'teams'>('workflow')

const handleFileProcessed = (data: EmployeeData[]) => {
  setRawData(data)
  handleStatusChange(`Successfully uploaded ${data.length} employee records!`, 'success')
  progress.value = 0
  showProgress.value = false
}

const handleStatusChange = (message: string, type: 'info' | 'success' | 'error') => {
  status.message = message
  status.type = type
}

const handleProgressUpdate = (value: number, text: string) => {
  progress.value = value
  progressText.value = text
  showProgress.value = value > 0
}

const handleDataProcessing = async () => {
  const success = await processEmployeesData()
  if (success) {
    handleStatusChange(`Successfully processed ${state.processedData.length} employee records!`, 'success')
    // Auto-advance to the overview step
    goNext()
  }
}

const handleProceedToValidation = () => {
  // Mark step 3 as completed before proceeding
  const step3 = steps.value.find(s => s.id === 3)
  if (step3) step3.completed = true
  
  // Directly go to step 4 (validation)
  goToStep(4)
}

const handleReprocessData = () => {
  // Reset processed data and go back to step 2
  state.processedData = []
  const step2 = steps.value.find(s => s.id === 2)
  if (step2) step2.completed = false
  
  // Trigger reprocessing
  handleDataProcessing()
}

const handleProceedToGeneration = async (validatedData: EmployeeValidation[]) => {
  setValidatedData(validatedData)
  goNext()
  
  // Auto-trigger generation
  await handleGenerateMessages()
}

const handleGenerateMessages = async () => {
  const success = await generateBirthdayMessages()
  if (success) {
    handleStatusChange(`Successfully generated ${state.generatedMessages.length} birthday messages!`, 'success')
  }
}

const handlePageChange = (page: 'workflow' | 'teams') => {
  currentPage.value = page
}</script>