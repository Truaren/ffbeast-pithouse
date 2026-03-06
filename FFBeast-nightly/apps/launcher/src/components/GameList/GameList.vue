<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { Game } from '../../types';
import { GameService } from '../../services/tauri';

export default defineComponent({
  name: 'GameList',
  emits: ['edit-game'],
  setup(props, { emit }) {
    const games = ref<Game[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const loadGames = async () => {
      loading.value = true;
      error.value = null;
      try {
        games.value = await GameService.getGames();
      } catch (e) {
        error.value = "Failed to load games";
        console.error(e);
      } finally {
        loading.value = false;
      }
    };

    const handleLaunch = async (id: string) => {
        try {
            await GameService.launchGame(id);
        } catch(e) {
            alert("Error launching game: " + e);
        }
    };

    const handleEdit = (gameId: string) => {
        emit('edit-game', gameId);
    };

    const handleDelete = async (game: Game) => {
        if (confirm(`Tem certeza que deseja remover "${game.name}"?`)) {
            try {
                await GameService.deleteGame(game.id);
                await loadGames();
            } catch (e) {
                alert("Erro ao remover jogo: " + e);
            }
        }
    };

    onMounted(() => {
      loadGames();
    });

    return {
      games,
      loading,
      error,
      loadGames,
      handleLaunch,
      handleEdit,
      handleDelete
    };
  }
});
</script>

<template>
  <div class="game-list">
    <div v-if="loading" class="loading">Scanning Library...</div>
    
    <div v-else-if="games.length === 0" class="empty-state">
      <p>{{ $t('library.no_games') }}</p>
      <button @click="loadGames" class="btn-refresh">{{ $t('library.scan_retry') }}</button>
    </div>

    <div v-else class="grid">
      <div v-for="game in games" :key="game.id" class="game-card">
        <div class="cover-placeholder" v-if="!game.cover_path">
            <span class="icon">🎮</span>
        </div>
        <div class="cover-image" v-else>
            <img :src="game.cover_path" :alt="game.name" />
        </div>
        <div class="info">
            <h3>{{ game.name }}</h3>
            <div class="actions">
                <button @click="handleLaunch(game.id)" class="btn-launch">{{ $t('library.launch') }}</button>
                <button @click="handleEdit(game.id)" class="btn-edit" title="Editar">✏️</button>
                <button @click="handleDelete(game)" class="btn-delete" title="Remover">🗑️</button>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-list {
    width: 100%;
}

.loading {
    padding: 2rem;
    text-align: center;
    color: var(--text-color);
    opacity: 0.7;
}

.empty-state {
    padding: 4rem;
    text-align: center;
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px dashed var(--border-color);
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
}

.game-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
    display: flex;
    flex-direction: column;
}

.game-card:hover {
    transform: translateY(-4px);
    border-color: var(--primary-color);
}

.cover-placeholder {
    height: 140px;
    background: linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.cover-placeholder .icon {
    font-size: 3rem;
    opacity: 0.5;
}

.info {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
}

.info h3 {
    font-size: 1.1rem;
    font-weight: 600;
}

.cover-image {
    height: 140px;
    overflow: hidden;
    background: #000;
}

.cover-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.actions {
    margin-top: auto;
    display: flex;
    gap: 0.5rem;
}

.btn-launch {
    flex: 1;
    padding: 0.8rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
}

.btn-launch:hover {
    background: var(--primary-hover);
}

.btn-edit, .btn-delete {
    padding: 0.8rem;
    width: 40px;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-edit:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
}

.btn-delete:hover {
    background: #f44336;
    border-color: #f44336;
}

.btn-refresh {
    margin-top: 1rem;
    padding: 0.6rem 1.2rem;
    background: transparent;
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    border-radius: 8px;
    cursor: pointer;
}
</style>
