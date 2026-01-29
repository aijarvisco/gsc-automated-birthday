<template>
  <tr
    :class="[
      'border-b hover:bg-muted/50 transition-colors',
      isEditing ? 'bg-blue-50' : '',
      !employee.validation.isValid ? 'bg-red-50' : '',
      employee.validation.warnings.length > 0 && employee.validation.isValid
        ? 'bg-orange-50'
        : '',
    ]"
  >
    <!-- Status Column -->
    <td class="p-3">
      <div class="flex items-center gap-2">
        <div
          v-if="!employee.validation.isValid"
          class="w-2 h-2 rounded-full bg-red-500"
          title="Has Errors"
        ></div>
        <div
          v-else-if="employee.validation.warnings.length > 0"
          class="w-2 h-2 rounded-full bg-orange-500"
          title="Has Warnings"
        ></div>
        <div
          v-else
          class="w-2 h-2 rounded-full bg-green-500"
          title="Valid"
        ></div>

        <div
          v-if="employee.isEdited"
          class="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded"
          title="Modified"
        >
          EDITED
        </div>
      </div>
    </td>

    <!-- Employee Number Column -->
    <td class="p-3">
      <span class="text-sm font-mono">{{ employee.number }}</span>
    </td>

    <!-- Name Column -->
    <td class="p-3">
      <input
        v-if="isEditing"
        v-model="editForm.name"
        type="text"
        class="w-full px-2 py-1 border border-input bg-background rounded text-sm"
        placeholder="Employee name"
      />
      <span v-else class="text-sm font-medium">{{ employee.name }}</span>
    </td>

    <!-- Team Column -->
    <td class="p-3">
      <template v-if="isEditing">
        <input
          v-model="editForm.teamName"
          type="text"
          class="w-full px-2 py-1 border border-input bg-background rounded text-sm"
          placeholder="Team name"
          list="team-suggestions"
        />
        <datalist id="team-suggestions">
          <option v-for="team in commonTeams" :key="team" :value="team">
            {{ team }}
          </option>
        </datalist>
      </template>
      <span v-else class="text-sm">{{
        employee.teamName || "Not assigned"
      }}</span>
    </td>

    <!-- Birthday Column -->
    <td class="p-3">
      <input
        v-if="isEditing"
        v-model="editForm.formattedDate"
        type="text"
        class="w-full px-2 py-1 border border-input bg-background rounded text-sm"
        placeholder="Birthday date"
      />
      <span v-else class="text-sm">{{
        formatDate(employee.formattedDate)
      }}</span>
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
          >
            <CheckIcon class="w-3 h-3" />
            Save
          </Button>
          <Button
            @click="cancelEdit"
            size="sm"
            variant="ghost"
            class="h-7 text-xs gap-1"
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
          >
            <PencilIcon class="w-3 h-3" />
            Edit
          </Button>
          <Button
            @click="showDetails"
            size="sm"
            variant="ghost"
            class="h-7 text-xs gap-1"
          >
            <EyeIcon class="w-3 h-3" />
            View
          </Button>
        </template>
      </div>
    </td>
  </tr>

  <!-- Validation Issues Row -->
  <tr
    v-if="
      showValidationIssues &&
      (employee.validation.errors.length > 0 ||
        employee.validation.warnings.length > 0)
    "
  >
    <td colspan="6" class="px-3 pb-3">
      <div class="bg-muted/50 rounded-lg p-3 space-y-2">
        <div v-if="employee.validation.errors.length > 0">
          <div class="text-xs font-medium text-red-700 mb-1">Errors:</div>
          <div
            v-for="error in employee.validation.errors"
            :key="error"
            class="text-xs text-red-600 flex items-center gap-1"
          >
            <AlertCircleIcon class="w-3 h-3" />
            {{ error }}
          </div>
        </div>
        <div v-if="employee.validation.warnings.length > 0">
          <div class="text-xs font-medium text-orange-700 mb-1">Warnings:</div>
          <div
            v-for="warning in employee.validation.warnings"
            :key="warning"
            class="text-xs text-orange-600 flex items-center gap-1"
          >
            <AlertTriangleIcon class="w-3 h-3" />
            {{ warning }}
          </div>
        </div>
      </div>
    </td>
  </tr>

  <!-- Employee Details Modal -->
  <div
    v-if="showDetailsModal"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click="closeDetails"
  >
    <div class="bg-background p-6 rounded-lg max-w-lg w-full mx-4" @click.stop>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Employee Details</h3>
        <Button @click="closeDetails" size="sm" variant="ghost">
          <XIcon class="w-4 h-4" />
        </Button>
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-muted-foreground"
              >Employee Number</label
            >
            <p class="text-sm">{{ employee.number }}</p>
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground"
              >Name</label
            >
            <p class="text-sm">{{ employee.name }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-muted-foreground"
              >Team</label
            >
            <p class="text-sm">{{ employee.teamName || "Not assigned" }}</p>
          </div>
          <div>
            <label class="text-xs font-medium text-muted-foreground"
              >Birthday</label
            >
            <p class="text-sm">{{ formatDate(employee.formattedDate) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Team Update Confirmation Modal -->
  <TeamUpdateConfirmationModal
    :show="showTeamUpdateModal"
    :original-team-name="originalTeamName"
    :new-team-name="pendingTeamName"
    :affected-employees-count="affectedEmployeesCount"
    :is-updating="isUpdatingTeam"
    @update-database="handleUpdateDatabase"
    @update-local-only="handleUpdateLocalOnly"
    @cancel="handleCancelTeamUpdate"
  />
</template>

<script setup lang="ts">
import { ref, computed, inject, type Ref } from "vue";
import {
  PencilIcon,
  EyeIcon,
  CheckIcon,
  XIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
} from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import TeamUpdateConfirmationModal from "./TeamUpdateConfirmationModal.vue";
import { teamsService } from "@/services/teams";
import type { EmployeeValidation } from "@/types/employee";

interface Props {
  employee: EmployeeValidation;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [employee: EmployeeValidation];
  validate: [employee: EmployeeValidation];
  teamUpdated: [originalTeam: string, newTeam: string];
}>();

const isEditing = ref(false);
const showDetailsModal = ref(false);
const showTeamUpdateModal = ref(false);
const isUpdatingTeam = ref(false);
const originalTeamName = ref("");
const pendingTeamName = ref("");
const pendingUpdatedEmployee = ref<EmployeeValidation | null>(null);

const editForm = ref<{
  name: string;
  teamName: string;
  formattedDate: string;
}>({
  name: "",
  teamName: "",
  formattedDate: "",
});

// Try to get all employees from parent to calculate affected count
const allEmployees = inject<Ref<EmployeeValidation[]>>('allEmployees', ref([]));

// Common team names for autocomplete
const commonTeams = [
  "Engineering",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Design",
  "Product",
  "Support",
];

const showValidationIssues = computed(
  () =>
    !props.employee.validation.isValid ||
    props.employee.validation.warnings.length > 0,
);

const affectedEmployeesCount = computed(() => {
  if (!originalTeamName.value || !allEmployees.value) return 0;
  return allEmployees.value.filter(emp => emp.teamName === originalTeamName.value).length;
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return "Not set";
  return dateStr;
};


const startEdit = () => {
  editForm.value = {
    name: props.employee.name,
    teamName: props.employee.teamName,
    formattedDate: props.employee.formattedDate,
  };
  isEditing.value = true;
};

const saveChanges = () => {
  const updatedEmployee: EmployeeValidation = {
    ...props.employee,
    name: editForm.value.name,
    teamName: editForm.value.teamName,
    formattedDate: editForm.value.formattedDate,
  };

  // Check if team name changed
  const teamChanged = props.employee.teamName !== editForm.value.teamName;
  
  if (teamChanged && props.employee.teamName && editForm.value.teamName) {
    // Store the original and new team names for the modal
    originalTeamName.value = props.employee.teamName;
    pendingTeamName.value = editForm.value.teamName;
    pendingUpdatedEmployee.value = updatedEmployee;
    
    // Show the confirmation modal
    showTeamUpdateModal.value = true;
  } else {
    // No team change, proceed with normal update
    emit("update", updatedEmployee);
    isEditing.value = false;
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  editForm.value = {
    name: "",
    teamName: "",
    formattedDate: "",
  };
};

const showDetails = () => {
  showDetailsModal.value = true;
};

const closeDetails = () => {
  showDetailsModal.value = false;
};

const handleUpdateDatabase = async () => {
  if (!pendingUpdatedEmployee.value || !originalTeamName.value || !pendingTeamName.value) return;
  
  isUpdatingTeam.value = true;
  
  try {
    // Try to update the team in the database
    const response = await teamsService.updateTeam({
      id: props.employee.teamId || 0, // Use actual team ID from employee data
      initial_name: originalTeamName.value,
      correct_name: pendingTeamName.value
    });
    
    if (response.success) {
      // Notify parent about the team update so it can update all affected employees
      emit("teamUpdated", originalTeamName.value, pendingTeamName.value);
    }
    
    // Complete the employee update regardless of team update success
    emit("update", pendingUpdatedEmployee.value);
    isEditing.value = false;
    showTeamUpdateModal.value = false;
    
  } catch (error) {
    console.error('Failed to update team in database:', error);
    // Still update the employee locally even if team update fails
    emit("update", pendingUpdatedEmployee.value);
    isEditing.value = false;
    showTeamUpdateModal.value = false;
  } finally {
    isUpdatingTeam.value = false;
    pendingUpdatedEmployee.value = null;
    originalTeamName.value = "";
    pendingTeamName.value = "";
  }
};

const handleUpdateLocalOnly = () => {
  if (!pendingUpdatedEmployee.value) return;
  
  // Just update this employee without touching the database
  emit("update", pendingUpdatedEmployee.value);
  isEditing.value = false;
  showTeamUpdateModal.value = false;
  pendingUpdatedEmployee.value = null;
  originalTeamName.value = "";
  pendingTeamName.value = "";
};

const handleCancelTeamUpdate = () => {
  showTeamUpdateModal.value = false;
  pendingUpdatedEmployee.value = null;
  originalTeamName.value = "";
  pendingTeamName.value = "";
  // Keep editing mode active so user can make different changes
};
</script>
