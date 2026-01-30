<template>
  <div class="relative">
    <button
      type="button"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :class="cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )"
      @click="toggleOpen"
      @blur="handleBlur"
      ref="triggerRef"
    >
      <span v-if="selectedOption" class="block truncate">
        {{ selectedOption.label }}
      </span>
      <span v-else class="text-muted-foreground">
        {{ placeholder }}
      </span>
      <ChevronDownIcon class="h-4 w-4 opacity-50" />
    </button>
    
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md"
        role="listbox"
        ref="optionsRef"
      >
        <div class="max-h-60 overflow-auto p-1">
          <div
            v-for="option in options"
            :key="option.value"
            role="option"
            :aria-selected="modelValue === option.value"
            :class="cn(
              'relative cursor-default select-none rounded-sm px-2 py-1.5 text-sm outline-none',
              modelValue === option.value 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-accent hover:text-accent-foreground'
            )"
            @click="selectOption(option)"
          >
            {{ option.label }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  modelValue?: string
  options: SelectOption[]
  placeholder?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement>()
const optionsRef = ref<HTMLElement>()

const selectedOption = computed(() => 
  props.options.find(option => option.value === props.modelValue)
)

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const selectOption = (option: SelectOption) => {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

const handleBlur = (event: FocusEvent) => {
  // Only close if focus is not moving to the options list
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && optionsRef.value?.contains(relatedTarget)) {
    return
  }
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (
    triggerRef.value && 
    !triggerRef.value.contains(event.target as Node) &&
    optionsRef.value && 
    !optionsRef.value.contains(event.target as Node)
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>