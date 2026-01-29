<template>
  <div class="flex justify-center mb-8">
    <div class="inline-flex p-1 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
      <button
        @click="$emit('page-change', 'workflow')"
        :class="[
          'px-6 py-2.5 rounded-md font-medium text-sm transition-all duration-200',
          currentPage === 'workflow'
            ? 'bg-white text-purple-700 shadow-lg'
            : 'text-white hover:bg-white/20'
        ]"
      >
        <div class="flex items-center gap-2">
          <FileTextIcon class="w-4 h-4" />
          Birthday Workflow
        </div>
      </button>
      <button
        @click="$emit('page-change', 'teams')"
        :class="[
          'px-6 py-2.5 rounded-md font-medium text-sm transition-all duration-200',
          currentPage === 'teams'
            ? 'bg-white text-purple-700 shadow-lg'
            : 'text-white hover:bg-white/20'
        ]"
      >
        <div class="flex items-center gap-2">
          <UsersIcon class="w-4 h-4" />
          Teams Management
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileTextIcon, UsersIcon } from 'lucide-vue-next'

interface Props {
  currentPage: 'workflow' | 'teams'
}

defineProps<Props>()

defineEmits<{
  pageChange: [page: 'workflow' | 'teams']
}>()
</script>