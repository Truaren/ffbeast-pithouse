import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface LogEntry {
    time: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    source?: 'frontend' | 'backend';
}

export const useLogStore = defineStore('logs', () => {
    const logs = ref<LogEntry[]>([
        {
            time: new Date().toLocaleTimeString(),
            level: 'info',
            message: 'Log system initialized and ready.',
            source: 'frontend'
        }
    ]);
    const maxLogs = 1000;

    const addLog = (level: LogEntry['level'], message: string, source: 'frontend' | 'backend' = 'frontend') => {
        const time = new Date().toLocaleTimeString();
        logs.value.push({ time, level, message, source });

        if (logs.value.length > maxLogs) {
            logs.value.shift();
        }
    };

    const clearLogs = () => {
        logs.value = [];
    };

    const info = (msg: string) => addLog('info', msg);
    const warn = (msg: string) => addLog('warn', msg);
    const error = (msg: string) => addLog('error', msg);
    const debug = (msg: string) => addLog('debug', msg);

    return {
        logs,
        addLog,
        clearLogs,
        info,
        warn,
        error,
        debug
    };
});
