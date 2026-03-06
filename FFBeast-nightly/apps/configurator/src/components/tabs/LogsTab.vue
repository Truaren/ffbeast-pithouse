<template>
  <div class="logs-tab">
    <BaseCard :title="$t('tabs.logs') + ' (Live)'" class="logs-card">
      <template #header>
        <div class="logs-header">
          <div class="logs-title">
            <h3>{{ $t('tabs.logs') }}</h3>
            <span class="logs-badge">Live</span>
          </div>
          <div class="logs-actions">
            <label class="scroll-toggle">
              <input type="checkbox" v-model="autoScroll" class="scroll-checkbox">
              <span>{{ $t('labels.auto_scroll') || 'Auto-scroll' }}</span>
            </label>
            <button class="btn-action" @click="clearLogs">{{ $t('buttons.clear') || 'Clear' }}</button>
            <button class="btn-action" @click="exportLogs">{{ $t('buttons.export') || 'Export' }}</button>
          </div>
        </div>
      </template>
      <div class="logs-viewport" ref="scrollContainer">
        <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.level]">
          <span class="log-time">[{{ log.time }}]</span>
          <span class="log-source" v-if="log.source">[{{ log.source.toUpperCase().slice(0,2) }}]</span>
          <span class="log-level">[{{ log.level.toUpperCase() }}]</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useLogStore } from '../../stores/logs';
import BaseCard from '../common/BaseCard.vue';

const logStore = useLogStore();
const { logs } = storeToRefs(logStore);
const scrollContainer = ref<HTMLElement | null>(null);
const autoScroll = ref(true);

const scrollToBottom = async () => {
  if (!autoScroll.value) return;
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
};

watch(() => logs.value.length, () => {
  if (autoScroll.value) {
    scrollToBottom();
  }
});

const clearLogs = () => {
  logStore.clearLogs();
};

const exportLogs = () => {
  const content = logs.value.map(l => `[${l.time}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sodevs-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.logs-tab {
  padding: var(--content-padding);
  height: calc(100vh - 120px);
}

.logs-card {
  height: 100%;
}

:deep(.card-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.logs-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logs-badge {
  font-size: 10px;
  background: rgba(var(--status-success-rgb), 0.15);
  color: var(--status-success);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.logs-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scroll-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
}

.scroll-checkbox {
  accent-color: var(--accent-primary);
}

.btn-action {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--text-main);
  color: var(--text-main);
}

.logs-viewport {
  flex: 1;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem;
  font-family: var(--font-mono);
  font-size: 13px;
  overflow-y: auto;
  margin-top: 1rem;
}

.log-item {
  margin-bottom: 6px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-time { color: var(--text-secondary); opacity: 0.7; margin-right: 10px; }
.log-source { color: var(--accent-primary); margin-right: 10px; font-weight: 600; opacity: 0.8; }
.log-level { font-weight: 700; margin-right: 10px; width: 60px; display: inline-block; }

.info .log-level { color: var(--status-info); }
.warn .log-level { color: var(--status-warning); }
.error .log-level { color: var(--status-error); }
.trace .log-level { color: #888; }
.debug .log-level { color: #aaa; }

.log-message { color: var(--text-main); }
</style>

