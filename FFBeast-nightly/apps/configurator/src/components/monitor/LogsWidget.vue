<template>
  <section class="logs-card">
    <div class="card-header">
      <h3>{{ $t('tabs.logs') }}</h3>
    </div>
    <div class="logs-container" ref="logsContainer">
      <div v-for="(log, index) in logs" :key="index" :class="['log-entry', log.level]">
        <span class="log-time">[{{ log.time }}]</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
      <div v-if="logs.length === 0" class="no-logs">
        Waiting for device...
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onUpdated } from 'vue';

interface LogEntry {
  time: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
}

defineProps<{
  logs: LogEntry[];
}>();

const logsContainer = ref<HTMLElement | null>(null);

onUpdated(() => {
  if (logsContainer.value) {
    logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
  }
});
</script>

<style scoped>
/* ... existing styles ... */
section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.card-header h3 {
  font-size: 0.9rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.logs-container {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
  padding: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  overflow-y: auto;
  max-height: 300px;
}

.log-entry {
  margin-bottom: 4px;
  line-height: 1.4;
}

.log-time {
  color: var(--text-dim);
  margin-right: 8px;
}

.info { color: var(--info); }
.warn { color: var(--warning); }
.error { color: var(--danger); }
.debug { color: #888; }

.no-logs {
  color: var(--text-dim);
  text-align: center;
  padding: 2rem;
  font-style: italic;
}
</style>
