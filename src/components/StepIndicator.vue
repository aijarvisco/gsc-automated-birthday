<template>
  <div class="w-full py-6">
    <div class="flex items-center justify-between">
      <div 
        v-for="(step, index) in steps" 
        :key="step.id"
        class="flex items-center"
        :class="{ 'flex-1': index < steps.length - 1 }"
      >
        <!-- Step Circle -->
        <div 
          class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300"
          :class="getStepClasses(step)"
        >
          <CheckIcon 
            v-if="step.completed" 
            class="w-5 h-5 text-white" 
          />
          <span 
            v-else 
            class="text-sm font-semibold"
            :class="step.current ? 'text-white' : 'text-muted-foreground'"
          >
            {{ step.id }}
          </span>
        </div>

        <!-- Step Label -->
        <div class="ml-3 min-w-0">
          <p 
            class="text-sm font-medium"
            :class="step.current ? 'text-foreground' : step.completed ? 'text-foreground' : 'text-muted-foreground'"
          >
            {{ step.title }}
          </p>
          <p 
            class="text-xs"
            :class="step.current ? 'text-muted-foreground' : 'text-muted-foreground'"
          >
            {{ step.description }}
          </p>
        </div>

        <!-- Connector Line -->
        <div 
          v-if="index < steps.length - 1" 
          class="flex-1 h-0.5 mx-4 transition-colors duration-300"
          :class="step.completed ? 'bg-primary' : 'bg-border'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon } from 'lucide-vue-next'
import type { WorkflowStep } from '@/types/employee'

defineProps<{
  steps: WorkflowStep[]
}>()

const getStepClasses = (step: WorkflowStep) => {
  if (step.completed) {
    return 'bg-primary border-primary'
  } else if (step.current) {
    return 'bg-primary border-primary'
  } else {
    return 'bg-background border-border'
  }
}
</script>