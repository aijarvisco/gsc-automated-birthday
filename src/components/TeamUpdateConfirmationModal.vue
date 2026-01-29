<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click="onCancel"
  >
    <div class="bg-background p-6 rounded-lg max-w-md w-full mx-4 shadow-xl" @click.stop>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Update Team Name</h3>
        <Button @click="onCancel" size="sm" variant="ghost">
          <XIcon class="w-4 h-4" />
        </Button>
      </div>

      <div class="space-y-4">
        <div class="p-4 bg-blue-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <InfoIcon class="w-5 h-5 text-blue-600" />
            <span class="font-medium text-blue-900">Team Name Change Detected</span>
          </div>
          <p class="text-sm text-blue-800">
            You changed the team name from "<strong>{{ originalTeamName }}</strong>" to "<strong>{{ newTeamName }}</strong>".
          </p>
        </div>

        <div class="space-y-3">
          <p class="text-sm text-muted-foreground">
            Would you like to update this team name in the database? This will:
          </p>
          <ul class="text-sm text-muted-foreground space-y-1 ml-4">
            <li class="flex items-start gap-2">
              <CheckIcon class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              Update the team mapping in the database
            </li>
            <li class="flex items-start gap-2">
              <CheckIcon class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              Apply the new name to all {{ affectedEmployeesCount }} employee(s) with the same team
            </li>
            <li class="flex items-start gap-2">
              <CheckIcon class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              Keep the change for future uploads
            </li>
          </ul>
        </div>

        <div class="bg-orange-50 p-3 rounded-lg">
          <div class="flex items-start gap-2">
            <AlertTriangleIcon class="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div class="text-sm text-orange-800">
              <p class="font-medium mb-1">Choose "No" if:</p>
              <p>This is a one-time correction that shouldn't affect the database or other employees.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <Button
          @click="onCancel"
          variant="outline"
          class="flex-1"
        >
          Cancel
        </Button>
        <Button
          @click="onUpdateDatabase"
          class="flex-1 bg-blue-600 hover:bg-blue-700"
          :disabled="isUpdating"
        >
          <LoaderIcon v-if="isUpdating" class="w-4 h-4 mr-2 animate-spin" />
          Yes, Update Database
        </Button>
        <Button
          @click="onUpdateLocalOnly"
          variant="outline"
          class="flex-1"
        >
          No, Local Only
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  XIcon, 
  InfoIcon, 
  CheckIcon, 
  AlertTriangleIcon, 
  LoaderIcon 
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

interface Props {
  show: boolean
  originalTeamName: string
  newTeamName: string
  affectedEmployeesCount: number
  isUpdating?: boolean
}

withDefaults(defineProps<Props>(), {
  isUpdating: false
})

const emit = defineEmits<{
  updateDatabase: []
  updateLocalOnly: []
  cancel: []
}>()

const onUpdateDatabase = () => {
  emit('updateDatabase')
}

const onUpdateLocalOnly = () => {
  emit('updateLocalOnly')
}

const onCancel = () => {
  emit('cancel')
}
</script>