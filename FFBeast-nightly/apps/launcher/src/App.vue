<script lang="ts">
import { defineComponent, ref } from 'vue';
import GameList from './components/GameList/GameList.vue';
import HardwareMonitor from './components/HardwareMonitor/HardwareMonitor.vue';
import WheelConfigModal from './components/WheelConfig/WheelConfigModal.vue';
import AddGameModal from './components/AddGameModal/AddGameModal.vue';
import SettingsModal from './components/SettingsModal.vue';

export default defineComponent({
  name: 'App',
  components: {
    GameList,
    HardwareMonitor,
    WheelConfigModal,
    AddGameModal,
    SettingsModal
  },
  setup() {
    const showAddModal = ref(false);
    const showConfigModal = ref(false);
    const showSettingsModal = ref(false);
    const gameListRef = ref<InstanceType<typeof GameList> | null>(null);
    const editingGameId = ref<string | undefined>(undefined);

    const onGameSaved = () => {
        // Refresh list
        if(gameListRef.value) {
            gameListRef.value.loadGames();
        }
    };

    const handleEditGame = (gameId: string) => {
        editingGameId.value = gameId;
        showAddModal.value = true;
    };

    const handleCloseModal = () => {
        showAddModal.value = false;
        editingGameId.value = undefined;
    };

    return {
        showAddModal,
        showConfigModal,
        showSettingsModal,
        gameListRef,
        editingGameId,
        onGameSaved,
        handleEditGame,
        handleCloseModal
    };
  }
});
</script>

<template>
  <div class="container">
    <header>
      <h1>{{ $t('app.title') }}</h1>
      <nav class="main-nav">
        <!-- Optional: Could restart library view if needed, but now it's static -->
        <button class="active">
          📚 Biblioteca
        </button>
        <button @click="showSettingsModal = true">
          ⚙️ Configurações
        </button>
      </nav>
    </header>
    
    <main>
       <!-- Top Section: Hardware Info and Config -->
       <HardwareMonitor @open-config="showConfigModal = true" />

       <!-- Bottom Section: Library -->
       <section class="library-section">
          <div class="section-header">
            <h2>{{ $t('library.title') }}</h2>
            <button class="btn-add" @click="showAddModal = true">+ {{ $t('library.add_game') }}</button>
          </div>
          <GameList ref="gameListRef" @edit-game="handleEditGame" />
       </section>
    </main>
    
    <AddGameModal 
        v-if="showAddModal" 
        :gameId="editingGameId"
        @close="handleCloseModal"
        @saved="onGameSaved"
    />
    
    <WheelConfigModal
        v-if="showConfigModal"
        @close="showConfigModal = false"
    />

    <SettingsModal
        v-if="showSettingsModal"
        :show="showSettingsModal"
        @close="showSettingsModal = false"
    />

    <footer>
        <p>SODevs Launcher v0.1.0 (Vue + Rust)</p>
    </footer>
  </div>
</template>


<style scoped>
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

header {
    margin-bottom: 3rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

h1 {
  background: linear-gradient(to right, #8b5cf6, #d946ef);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}

header {
    margin-bottom: 3rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.main-nav {
    display: flex;
    gap: 1rem;
}

.main-nav button {
    padding: 0.6rem 1.2rem;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-color);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.main-nav button.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
}

.main-nav button:hover:not(.active) {
    border-color: var(--primary-color);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.btn-add {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
}

.btn-add:hover {
    background: var(--primary-hover);
}

main {
    min-height: 60vh;
}

footer {
    margin-top: 4rem;
    text-align: center;
    opacity: 0.4;
    font-size: 0.8rem;
}
</style>
