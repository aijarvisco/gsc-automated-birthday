<template>
  <div class="space-y-6">
    <!-- Header and Stats -->
    <Card>
      <CardHeader>
        <CardTitle>Teams Management</CardTitle>
        <CardDescription>
          Manage team name mappings for consistent employee data validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="text-center p-4 bg-muted/20 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ teamStats.total }}</div>
            <div class="text-sm text-muted-foreground">Total Teams</div>
          </div>
          <div class="text-center p-4 bg-muted/20 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ teamStats.filtered }}</div>
            <div class="text-sm text-muted-foreground">Filtered Results</div>
          </div>
          <div class="text-center p-4 bg-muted/20 rounded-lg">
            <div class="text-2xl font-bold text-orange-600">{{ teamStats.recentlyUpdated }}</div>
            <div class="text-sm text-muted-foreground">Recently Updated</div>
          </div>
        </div>

        <!-- Actions Bar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div class="flex gap-2">
            <Button @click="showCreateModal = true" class="gap-2">
              <PlusIcon class="w-4 h-4" />
              Add Team
            </Button>
            <Button @click="fetchTeams" variant="outline" :disabled="state.isLoading" class="gap-2">
              <RefreshCwIcon class="w-4 h-4" />
              Refresh
            </Button>
          </div>
          
          <!-- Search -->
          <div class="w-full sm:w-auto">
            <div class="relative">
              <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                :value="state.searchTerm"
                @input="setSearchTerm(($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="Search teams..."
                class="pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm w-full sm:w-80"
              />
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <Alert v-if="state.error" variant="destructive" class="mb-6">
          <AlertDescription class="flex justify-between items-center">
            <span>{{ state.error }}</span>
            <Button @click="clearError" size="sm" variant="ghost">
              <XIcon class="w-4 h-4" />
            </Button>
          </AlertDescription>
        </Alert>

        <!-- Loading State -->
        <div v-if="state.isLoading && filteredTeams.length === 0" class="text-center py-8">
          <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-muted-foreground">Loading teams...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!state.isLoading && filteredTeams.length === 0 && !state.searchTerm" class="text-center py-8">
          <div class="text-4xl mb-4">📋</div>
          <h3 class="text-lg font-semibold mb-2">No Teams Found</h3>
          <p class="text-muted-foreground mb-4">
            Get started by adding your first team mapping
          </p>
          <Button @click="showCreateModal = true" class="gap-2">
            <PlusIcon class="w-4 h-4" />
            Add Your First Team
          </Button>
        </div>

        <!-- No Search Results -->
        <div v-else-if="!state.isLoading && filteredTeams.length === 0 && state.searchTerm" class="text-center py-8">
          <div class="text-4xl mb-4">🔍</div>
          <h3 class="text-lg font-semibold mb-2">No Results Found</h3>
          <p class="text-muted-foreground mb-4">
            No teams match your search for "{{ state.searchTerm }}"
          </p>
          <Button @click="setSearchTerm('')" variant="outline">
            Clear Search
          </Button>
        </div>

        <!-- Teams Table -->
        <div v-else-if="filteredTeams.length > 0">
          <TeamsTable 
            :teams="filteredTeams"
            :is-loading="state.isLoading"
            :sort-field="state.sortField"
            :sort-direction="state.sortDirection"
            @sort-change="setSorting"
            @edit-team="handleEditTeam"
            @delete-team="handleDeleteTeam"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Create/Edit Team Modal -->
    <TeamEditModal
      v-if="showCreateModal || editingTeam"
      :team="editingTeam"
      :is-loading="state.isLoading"
      @save="handleSaveTeam"
      @cancel="handleCancelEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  PlusIcon, 
  RefreshCwIcon, 
  SearchIcon, 
  XIcon 
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Alert from '@/components/ui/Alert.vue'
import AlertDescription from '@/components/ui/AlertDescription.vue'
import Button from '@/components/ui/Button.vue'
import TeamsTable from './TeamsTable.vue'
import TeamEditModal from './TeamEditModal.vue'
import { useTeams } from '@/composables/useTeams'
import type { Team, CreateTeamRequest, UpdateTeamRequest } from '@/types/teams'

const {
  state,
  filteredTeams,
  teamStats,
  setSearchTerm,
  setSorting,
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  clearError
} = useTeams()

const showCreateModal = ref(false)
const editingTeam = ref<Team | null>(null)

const handleEditTeam = (team: Team) => {
  editingTeam.value = team
}

const handleDeleteTeam = async (team: Team) => {
  if (confirm(`Are you sure you want to delete the team mapping "${team.initial_name}"?`)) {
    await deleteTeam(team.id)
  }
}

const handleSaveTeam = async (teamData: CreateTeamRequest | UpdateTeamRequest) => {
  let success = false
  
  if ('id' in teamData) {
    // Update existing team
    success = await updateTeam(teamData)
  } else {
    // Create new team
    success = await createTeam(teamData)
  }
  
  if (success) {
    showCreateModal.value = false
    editingTeam.value = null
  }
}

const handleCancelEdit = () => {
  showCreateModal.value = false
  editingTeam.value = null
}

// Load teams on mount
onMounted(() => {
  fetchTeams()
})
</script>