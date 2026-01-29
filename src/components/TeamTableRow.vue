<template>
  <tr :class="[
    'border-b hover:bg-muted/50 transition-colors',
    isEditing ? 'bg-blue-50' : ''
  ]">
    <!-- Initial Name Column -->
    <td class="p-3">
      <span class="text-sm font-medium">{{ team.initial_name }}</span>
    </td>

    <!-- Correct Name Column -->
    <td class="p-3">
      <input
        v-if="isEditing"
        v-model="editForm.correct_name"
        type="text"
        class="w-full px-2 py-1 border border-input bg-background rounded text-sm"
        placeholder="Correct team name"
        @keydown.enter="saveChanges"
        @keydown.escape="cancelEdit"
      />
      <span v-else class="text-sm">{{ team.correct_name || 'Not set' }}</span>
    </td>

    <!-- Last Updated Column -->
    <td class="p-3">
      <span class="text-sm text-muted-foreground">{{ formatDate(team.updated_at) }}</span>
    </td>

    <!-- Actions Column -->
    <td class="p-3">
      <div class="flex items-center gap-2">
        <template v-if="isEditing">
          <Button 
            @click="saveChanges"
            size="sm"
            variant="outline"
            class="h-7 text-xs gap-1"
            :disabled="isLoading"
          >
            <CheckIcon class="w-3 h-3" />
            Save
          </Button>
          <Button 
            @click="cancelEdit"
            size="sm"
            variant="ghost"
            class="h-7 text-xs gap-1"
            :disabled="isLoading"
          >
            <XIcon class="w-3 h-3" />
            Cancel
          </Button>
        </template>
        <template v-else>
          <Button 
            @click="startEdit"
            size="sm"
            variant="ghost"
            class="h-7 text-xs gap-1"
            :disabled="isLoading"
          >
            <PencilIcon class="w-3 h-3" />
            Edit
          </Button>
          <Button 
            @click="handleDelete"
            size="sm"
            variant="destructive"
            class="h-7 text-xs gap-1"
            :disabled="isLoading"
          >
            <Trash2Icon class="w-3 h-3" />
            Delete
          </Button>
        </template>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  PencilIcon, 
  Trash2Icon, 
  CheckIcon, 
  XIcon 
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import type { Team } from '@/types/teams'

interface Props {
  team: Team
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [team: Team]
  delete: [team: Team]
  update: [team: Team]
}>()

const isEditing = ref(false)
const editForm = ref({
  correct_name: ''
})

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
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

const startEdit = () => {
  editForm.value = {
    correct_name: props.team.correct_name || ''
  }
  isEditing.value = true
}

const saveChanges = () => {
  const updatedTeam: Team = {
    ...props.team,
    correct_name: editForm.value.correct_name.trim()
  }
  
  // Validate the change
  if (!updatedTeam.correct_name) {
    alert('Correct name cannot be empty')
    return
  }
  
  if (updatedTeam.correct_name === (props.team.correct_name || '')) {
    // No changes made
    cancelEdit()
    return
  }
  
  emit('update', updatedTeam)
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
  editForm.value = {
    correct_name: ''
  }
}

const handleDelete = () => {
  emit('delete', props.team)
}
</script>