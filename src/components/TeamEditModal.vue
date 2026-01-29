<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="handleBackdropClick">
    <div class="bg-background p-6 rounded-lg max-w-md w-full mx-4 shadow-xl" @click.stop>
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold">
          {{ isEditMode ? 'Edit Team Mapping' : 'Create Team Mapping' }}
        </h3>
        <Button @click="$emit('cancel')" size="sm" variant="ghost" :disabled="isLoading">
          <XIcon class="w-4 h-4" />
        </Button>
      </div>
      
      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Initial Name -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Initial Name *
          </label>
          <input
            v-model="form.initial_name"
            type="text"
            :disabled="isEditMode || isLoading"
            placeholder="Team name as it appears in data"
            class="w-full px-3 py-2 border border-input bg-background rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            :class="{ 'border-red-500': errors.initial_name }"
          />
          <p v-if="errors.initial_name" class="text-red-500 text-xs mt-1">
            {{ errors.initial_name }}
          </p>
          <p v-if="isEditMode" class="text-muted-foreground text-xs mt-1">
            Initial name cannot be changed
          </p>
        </div>

        <!-- Correct Name -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Correct Name *
          </label>
          <input
            v-model="form.correct_name"
            type="text"
            :disabled="isLoading"
            placeholder="Standardized team name"
            class="w-full px-3 py-2 border border-input bg-background rounded-md text-sm disabled:opacity-50"
            :class="{ 'border-red-500': errors.correct_name }"
          />
          <p v-if="errors.correct_name" class="text-red-500 text-xs mt-1">
            {{ errors.correct_name }}
          </p>
        </div>

        <!-- Validation Warnings -->
        <div v-if="warnings.length > 0" class="bg-orange-50 border border-orange-200 rounded-md p-3">
          <div class="text-sm font-medium text-orange-800 mb-1">Warnings:</div>
          <ul class="text-sm text-orange-700 space-y-1">
            <li v-for="warning in warnings" :key="warning" class="flex items-start gap-1">
              <AlertTriangleIcon class="w-3 h-3 mt-0.5 flex-shrink-0" />
              {{ warning }}
            </li>
          </ul>
        </div>

        <!-- Preview -->
        <div v-if="form.initial_name && form.correct_name" class="bg-muted/20 rounded-md p-3">
          <div class="text-sm font-medium mb-2">Preview:</div>
          <div class="text-sm">
            <span class="text-muted-foreground">"{{ form.initial_name }}"</span>
            <span class="mx-2">→</span>
            <span class="font-medium">"{{ form.correct_name }}"</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4">
          <Button 
            @click="$emit('cancel')" 
            type="button" 
            variant="outline"
            :disabled="isLoading"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            :disabled="!isFormValid || isLoading"
            class="gap-2"
          >
            <div v-if="isLoading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            {{ isEditMode ? 'Update' : 'Create' }} Team
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { XIcon, AlertTriangleIcon } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import type { Team, CreateTeamRequest, UpdateTeamRequest } from '@/types/teams'

interface Props {
  team?: Team | null
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [data: CreateTeamRequest | UpdateTeamRequest]
  cancel: []
}>()

const form = ref({
  initial_name: '',
  correct_name: ''
})

const errors = ref({
  initial_name: '',
  correct_name: ''
})

const warnings = ref<string[]>([])

const isEditMode = computed(() => !!props.team)

const isFormValid = computed(() => {
  return form.value.initial_name.trim() && 
         form.value.correct_name.trim() && 
         !errors.value.initial_name && 
         !errors.value.correct_name
})

const validateForm = () => {
  errors.value = {
    initial_name: '',
    correct_name: ''
  }
  warnings.value = []

  // Required field validation
  if (!form.value.initial_name.trim()) {
    errors.value.initial_name = 'Initial name is required'
  }
  if (!form.value.correct_name.trim()) {
    errors.value.correct_name = 'Correct name is required'
  }

  // Length validation
  if (form.value.initial_name.length > 100) {
    errors.value.initial_name = 'Initial name must be less than 100 characters'
  }
  if (form.value.correct_name.length > 100) {
    errors.value.correct_name = 'Correct name must be less than 100 characters'
  }

  // Warnings
  if (form.value.initial_name.length > 50) {
    warnings.value.push('Initial name is quite long')
  }
  if (form.value.correct_name.length > 50) {
    warnings.value.push('Correct name is quite long')
  }
  if (form.value.initial_name.toLowerCase() === form.value.correct_name.toLowerCase()) {
    warnings.value.push('Names are identical - mapping may not be necessary')
  }
}

const handleSubmit = () => {
  validateForm()
  
  if (!isFormValid.value) {
    return
  }

  const trimmedForm = {
    initial_name: form.value.initial_name.trim(),
    correct_name: form.value.correct_name.trim()
  }

  if (isEditMode.value && props.team) {
    // Update existing team
    const updateData: UpdateTeamRequest = {
      id: props.team.id,
      ...trimmedForm
    }
    emit('save', updateData)
  } else {
    // Create new team
    const createData: CreateTeamRequest = trimmedForm
    emit('save', createData)
  }
}

const handleBackdropClick = () => {
  if (!props.isLoading) {
    emit('cancel')
  }
}

// Initialize form with team data if editing
onMounted(() => {
  if (props.team) {
    form.value = {
      initial_name: props.team.initial_name,
      correct_name: props.team.correct_name
    }
  }
})

// Watch for form changes to validate
watch(
  () => form.value,
  () => {
    validateForm()
  },
  { deep: true }
)

// Validate on mount
onMounted(() => {
  validateForm()
})
</script>