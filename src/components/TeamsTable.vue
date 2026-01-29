<template>
  <div class="border rounded-lg overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-muted/50 border-b">
          <tr>
            <th 
              class="text-left p-3 font-medium text-sm cursor-pointer hover:bg-muted/70 transition-colors"
              @click="handleSort('initial_name')"
            >
              <div class="flex items-center gap-2">
                Initial Name
                <SortIcon 
                  :field="'initial_name'" 
                  :current-field="sortField" 
                  :direction="sortDirection" 
                />
              </div>
            </th>
            <th 
              class="text-left p-3 font-medium text-sm cursor-pointer hover:bg-muted/70 transition-colors"
              @click="handleSort('correct_name')"
            >
              <div class="flex items-center gap-2">
                Correct Name
                <SortIcon 
                  :field="'correct_name'" 
                  :current-field="sortField" 
                  :direction="sortDirection" 
                />
              </div>
            </th>
            <th 
              class="text-left p-3 font-medium text-sm cursor-pointer hover:bg-muted/70 transition-colors"
              @click="handleSort('updated_at')"
            >
              <div class="flex items-center gap-2">
                Last Updated
                <SortIcon 
                  :field="'updated_at'" 
                  :current-field="sortField" 
                  :direction="sortDirection" 
                />
              </div>
            </th>
            <th class="text-left p-3 font-medium text-sm w-32">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <TeamTableRow
            v-for="team in teams"
            :key="team.id"
            :team="team"
            :is-loading="isLoading"
            @edit="$emit('edit-team', $event)"
            @delete="$emit('delete-team', $event)"
            @update="handleUpdateTeam"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, defineComponent } from 'vue'
import { ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon } from 'lucide-vue-next'
import TeamTableRow from './TeamTableRow.vue'
import type { Team, TeamsState } from '@/types/teams'

interface Props {
  teams: Team[]
  isLoading: boolean
  sortField: TeamsState['sortField']
  sortDirection: TeamsState['sortDirection']
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sortChange: [field: TeamsState['sortField'], direction: TeamsState['sortDirection']]
  editTeam: [team: Team]
  deleteTeam: [team: Team]
}>()

const handleSort = (field: TeamsState['sortField']) => {
  let newDirection: TeamsState['sortDirection'] = 'asc'
  
  if (props.sortField === field) {
    newDirection = props.sortDirection === 'asc' ? 'desc' : 'asc'
  }
  
  emit('sortChange', field, newDirection)
}

const handleUpdateTeam = (updatedTeam: Team) => {
  // This will be handled by the parent component through the edit flow
  emit('editTeam', updatedTeam)
}

// Sort Icon Component
const SortIcon = defineComponent({
  name: 'SortIcon',
  props: {
    field: { type: String, required: true },
    currentField: { type: String, required: true },
    direction: { type: String, required: true }
  },
  setup(props) {
    return () => {
      if (props.currentField !== props.field) {
        return h(ChevronsUpDownIcon, { class: "w-4 h-4 text-muted-foreground" })
      }
      
      if (props.direction === 'asc') {
        return h(ChevronUpIcon, { class: "w-4 h-4 text-foreground" })
      } else {
        return h(ChevronDownIcon, { class: "w-4 h-4 text-foreground" })
      }
    }
  }
})
</script>