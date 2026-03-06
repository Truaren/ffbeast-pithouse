<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { Game } from '../../types';
import { GameService, SteamService } from '../../services/tauri';
import { SteamGame, GameMetadata } from '../../types/steam';
import { open } from '@tauri-apps/plugin-dialog';

export default defineComponent({
  name: 'AddGameModal',
  props: {
    gameId: {
      type: String,
      default: undefined
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const name = ref('');
    const path = ref('');
    const args = ref('');
    const isSteam = ref(false);
    const steamId = ref<number | null>(null);

    // Advanced vars
    const envVars = ref('');
    const dllOverrides = ref('');
    
    // Config vars
    const motionRange = ref(900);
    const totalForce = ref(100);
    const springStrength = ref(100);
    const invertForce = ref(false);

    // Steam integration
    const showSteamLibrary = ref(false);
    const showSearchResults = ref(false);
    const steamGames = ref<SteamGame[]>([]);
    const searchResults = ref<[number, string][]>([]);
    const searchQuery = ref('');
    const coverUrl = ref<string | null>(null);
    const isLoadingSearch = ref(false);
    const isLoadingSteamLib = ref(false);
    const isEditMode = ref(false);

    let searchTimeout: number | null = null;

    // Load existing game data if editing
    const loadGame = async () => {
        if (props.gameId) {
            isEditMode.value = true;
            try {
                const game = await GameService.getGame(props.gameId);
                if (game) {
                    name.value = game.name;
                    path.value = game.path;
                    args.value = game.arguments.join(' ');
                    isSteam.value = game.is_steam;
                    steamId.value = game.steam_id || null;
                    coverUrl.value = game.cover_path || null;
                    
                    // Load advanced settings
                    if (game.environment_vars) {
                        envVars.value = Object.entries(game.environment_vars)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(';');
                    }
                    if (game.dll_overrides) {
                        dllOverrides.value = game.dll_overrides.join(',');
                    }
                    
                    // Load wheel profile
                    if (game.wheel_profile) {
                        motionRange.value = game.wheel_profile.motion_range;
                        totalForce.value = game.wheel_profile.total_force;
                        springStrength.value = game.wheel_profile.spring_strenth;
                        invertForce.value = game.wheel_profile.invert_force;
                    }
                }
            } catch (e) {
                console.error('Failed to load game:', e);
                alert('Failed to load game: ' + e);
            }
        }
    };

    onMounted(loadGame);

    const closeModal = () => {
        emit('close');
        resetForm();
    };

    const resetForm = () => {
        name.value = '';
        path.value = '';
        args.value = '';
        isSteam.value = false;
        steamId.value = null;
        envVars.value = '';
        dllOverrides.value = '';
        motionRange.value = 900;
        totalForce.value = 100;
        springStrength.value = 100;
        invertForce.value = false;
        coverUrl.value = null;
        searchQuery.value = '';
        showSearchResults.value = false;
        showSteamLibrary.value = false;
    };

    const browseFile = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: 'Executables', extensions: ['exe', 'sh'] }]
            });
            if (selected) {
                path.value = selected as string;
            }
        } catch (e) {
            console.error(e);
        }
    };

    const openSteamLibrary = async () => {
        isLoadingSteamLib.value = true;
        try {
            steamGames.value = await SteamService.scanLibrary();
            showSteamLibrary.value = true;
        } catch (e) {
            console.error('Failed to scan Steam library:', e);
            alert('Failed to scan Steam library: ' + e);
        } finally {
            isLoadingSteamLib.value = false;
        }
    };

    const selectSteamGame = async (game: SteamGame) => {
        name.value = game.name;
        steamId.value = game.app_id;
        isSteam.value = true;
        
        if (game.executable) {
            path.value = game.executable;
        }

        showSteamLibrary.value = false;

        // Fetch metadata and save cover URL
        try {
            const metadata = await SteamService.fetchMetadata(game.app_id);
            if (metadata.cover_url) {
                coverUrl.value = metadata.cover_url;
            }
        } catch (e) {
            console.error('Failed to fetch metadata:', e);
        }
    };

    const searchGames = async () => {
        if (!searchQuery.value || searchQuery.value.length < 2) {
            searchResults.value = [];
            showSearchResults.value = false;
            return;
        }

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = window.setTimeout(async () => {
            isLoadingSearch.value = true;
            try {
                const results = await SteamService.searchGames(searchQuery.value);
                searchResults.value = results;
                showSearchResults.value = results.length > 0;
            } catch (e) {
                console.error('Search failed:', e);
            } finally {
                isLoadingSearch.value = false;
            }
        }, 500);
    };

    const selectSearchResult = async (appId: number, gameName: string) => {
        name.value = gameName;
        steamId.value = appId;
        isSteam.value = true;
        
        // Clear search to prevent watcher from triggering again
        searchQuery.value = '';
        showSearchResults.value = false;
        
        // Clear timeout if any
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            searchTimeout = null;
        }

        // Fetch full metadata
        try {
            const metadata = await SteamService.fetchMetadata(appId);
            if (metadata.cover_url) {
                coverUrl.value = metadata.cover_url;
            }
        } catch (e) {
            console.error('Failed to fetch metadata:', e);
        }
    };

    watch(searchQuery, searchGames);

    const saveGame = async () => {
        if(!name.value || (!path.value && !isSteam.value)) {
            alert("Name and Path (or Steam ID) are required");
            return;
        }

        // Use existing ID if editing, otherwise generate new one
        const id = props.gameId || name.value.toLowerCase().replace(/\s+/g, '-');
        
        const envVarsObj: Record<string, string> = {};
        if (envVars.value) {
            envVars.value.split(';').forEach(pair => {
                const [k, v] = pair.split('=');
                if (k && v) envVarsObj[k.trim()] = v.trim();
            });
        }

        const dllList = dllOverrides.value ? dllOverrides.value.split(',').map(s => s.trim()) : [];
        
        const newGame: Game = {
            id,
            name: name.value,
            path: path.value,
            is_steam: isSteam.value,
            steam_id: steamId.value || undefined,
            arguments: args.value ? args.value.split(' ') : [],
            environment_vars: envVarsObj,
            dll_overrides: dllList,
            use_compat_layer: false,
            cover_path: coverUrl.value || undefined, // Save cover URL
            icon_path: undefined, // Could add icon support later
            wheel_profile: {
                motion_range: Number(motionRange.value),
                total_force: Number(totalForce.value),
                spring_strenth: Number(springStrength.value),
                invert_force: invertForce.value
            }
        };

        try {
            await GameService.saveGame(newGame);
            emit('saved');
            closeModal();
        } catch (e) {
            console.error("Failed to save game", e);
            alert("Failed to save game: " + e);
        }
    };

    return {
        name,
        path,
        args,
        isSteam,
        steamId,
        envVars,
        dllOverrides,
        motionRange,
        totalForce,
        springStrength,
        invertForce,
        coverUrl,
        searchQuery,
        searchResults,
        showSearchResults,
        showSteamLibrary,
        steamGames,
        isLoadingSearch,
        isLoadingSteamLib,
        isEditMode,
        closeModal,
        saveGame,
        browseFile,
        openSteamLibrary,
        selectSteamGame,
        selectSearchResult
    };
  }
});
</script>

<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ isEditMode ? 'Editar Jogo' : $t('library.form.title') }}</h2>
      
      <!-- Game Cover Preview -->
      <div v-if="coverUrl" class="cover-preview">
        <img :src="coverUrl" alt="Game Cover" />
      </div>

      <!-- Steam Search -->
      <div class="form-group search-container">
        <label>🔍 {{ $t('library.form.search') }}</label>
        <input 
          type="text" 
          v-model="searchQuery" 
          :placeholder="$t('library.form.search')"
          @focus="showSearchResults = searchResults.length > 0"
        />
        <div v-if="isLoadingSearch" class="search-loading">{{ $t('library.form.searching') }}</div>
        <div v-if="showSearchResults" class="search-results">
          <div 
            v-for="[appId, gameName] in searchResults" 
            :key="appId"
            class="search-result-item"
            @click="selectSearchResult(appId, gameName)"
          >
            <span>{{ gameName }}</span>
            <span class="app-id">{{ appId }}</span>
          </div>
        </div>
      </div>

      <!-- Steam Library Button -->
      <div class="form-group">
        <button 
          class="btn-steam" 
          @click="openSteamLibrary"
          :disabled="isLoadingSteamLib"
        >
          🎮 {{ isLoadingSteamLib ? $t('library.form.loading') : $t('library.form.selectFromLibrary') }}
        </button>
      </div>

      <!-- Steam Library Modal -->
      <div v-if="showSteamLibrary" class="steam-library-overlay" @click.self="showSteamLibrary = false">
        <div class="steam-library-content">
          <h3>{{ $t('library.form.steamLibraryTitle') }}</h3>
          <div class="steam-games-list">
            <div 
              v-for="game in steamGames" 
              :key="game.app_id"
              class="steam-game-item"
              @click="selectSteamGame(game)"
            >
              <div class="game-info">
                <div class="game-name">{{ game.name }}</div>
                <div class="game-id">App ID: {{ game.app_id }}</div>
              </div>
            </div>
          </div>
          <button class="btn-close" @click="showSteamLibrary = false">{{ $t('library.form.close') }}</button>
        </div>
      </div>

      <div class="form-row">
          <div class="form-group flex-1">
            <label>{{ $t('library.form.name') }}</label>
            <input type="text" v-model="name" placeholder="Assetto Corsa" />
          </div>
          <div class="form-group checkbox-wrapper">
             <label>
                <input type="checkbox" v-model="isSteam"> Is Steam Game?
             </label>
          </div>
      </div>

      <div class="form-group" v-if="isSteam">
        <label>Steam App ID</label>
        <input type="number" v-model="steamId" placeholder="244210" />
      </div>

      <div class="form-group">
        <label>{{ $t('library.form.path') }}</label>
        <div class="input-row">
            <input type="text" v-model="path" placeholder="/path/to/game.exe" />
            <button class="btn-browse" @click="browseFile">📂</button>
        </div>
      </div>

      <div class="form-group">
        <label>{{ $t('library.form.args') }}</label>
        <input type="text" v-model="args" placeholder="--fullscreen" />
      </div>

      <!-- Advanced Section Toggle -->
      <details class="advanced-details">
          <summary>Opções Avançadas (Variáveis de Ambiente, DLLs)</summary>
          <div class="form-group">
            <label>Environment Variables (KEY=VALUE;KEY2=VAL2)</label>
            <input type="text" v-model="envVars" placeholder="DXVK_HUD=1" />
          </div>
          <div class="form-group">
            <label>DLL Overrides (d3d11,d3d9)</label>
            <input type="text" v-model="dllOverrides" />
          </div>
      </details>

      <!-- Wheel Profile Settings (Optional) -->
      <details class="advanced-details">
        <summary>Perfil de Volante (Opcional)</summary>
        <div class="profile-section">
          <div class="row">
               <div class="col">
                  <label>{{ $t('config.motion_range') }}</label>
                  <input type="number" v-model="motionRange" />
               </div>
               <div class="col">
                  <label>{{ $t('config.total_force') }} (%)</label>
                  <input type="number" v-model="totalForce" min="0" max="100"/>
               </div>
          </div>
          <div class="row mt-2">
               <div class="col">
                  <label>Spring (%)</label>
                  <input type="number" v-model="springStrength" min="0" max="100"/>
               </div>
               <div class="col checkbox-col">
                  <label>
                      <input type="checkbox" v-model="invertForce"> Invert Force
                  </label>
               </div>
          </div>
        </div>
      </details>

      <div class="actions">
        <button class="btn-secondary" @click="closeModal">{{ $t('library.form.cancel') }}</button>
        <button class="btn-primary" @click="saveGame">{{ $t('library.form.save') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    overflow: hidden; /* Prevent scrolling on background */
}

.modal-content {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    padding: 2rem;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

h2 {
    margin-bottom: 2rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    opacity: 0.8;
}

input[type="text"], input[type="number"] {
    width: 100%;
    padding: 0.8rem;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-color);
    font-size: 1rem;
}

input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.form-row {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}
.flex-1 { flex: 1; }
.checkbox-wrapper {
    margin-top: 1.8rem;
    white-space: nowrap;
}
.checkbox-wrapper input, .checkbox-col input {
    margin-right: 0.5rem;
    transform: scale(1.2);
}
.checkbox-col {
    display: flex;
    align-items: center;
    padding-top: 1.5rem;
}

.input-row {
    display: flex;
    gap: 0.5rem;
}

.btn-browse {
    padding: 0 1rem;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.2rem;
}
.btn-browse:hover {
    background: var(--border-color);
}

.advanced-details {
    background: rgba(0,0,0,0.03);
    padding: 0.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
}
.advanced-details summary {
    cursor: pointer;
    font-weight: 600;
    opacity: 0.7;
    margin-bottom: 0.5rem;
}

.mt-2 { margin-top: 1rem; }

.profile-section {
    margin-top: 2rem;
    background: rgba(0,0,0,0.05);
    padding: 1rem;
    border-radius: 8px;
}

.profile-section h3 {
    font-size: 0.9rem;
    margin-bottom: 1rem;
    opacity: 0.7;
}

.row {
    display: flex;
    gap: 1rem;
}

.col {
    flex: 1;
}

.actions {
    margin-top: 2rem;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.btn-primary {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
}

.btn-secondary {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
}

/* Steam Integration Styles */
.cover-preview {
    margin-bottom: 1.5rem;
    text-align: center;
}

.cover-preview img {
    max-width: 300px; /* Reduzido de 100% */
    max-height: 150px;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.search-container {
    position: relative;
}

.search-loading {
    font-size: 0.85rem;
    color: var(--primary-color);
    margin-top: 0.5rem;
}

.search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 100;
    margin-top: 0.25rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.search-result-item {
    padding: 0.75rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.2s;
}

.search-result-item:hover {
    background: var(--border-color);
}

.search-result-item .app-id {
    font-size: 0.75rem;
    opacity: 0.6;
}

.btn-steam {
    width: 100%;
    padding: 0.8rem 1.5rem;
    background: linear-gradient(135deg, #1b2838 0%, #2a475e 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.2s;
}

.btn-steam:hover:not(:disabled) {
    transform: translateY(-2px);
}

.btn-steam:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.steam-library-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    overflow: hidden; /* Prevent background scrolling */
}

.steam-library-content {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 2rem;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.steam-library-content h3 {
    margin-bottom: 1.5rem;
}

.steam-games-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    margin-bottom: 1.5rem;
    min-height: 0;
}

.steam-game-item {
    padding: 1rem;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}

.steam-game-item:hover {
    border-color: var(--primary-color);
    transform: translateX(4px);
}

.game-info .game-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.game-info .game-id {
    font-size: 0.85rem;
    opacity: 0.7;
}

.btn-close {
    padding: 0.8rem 1.5rem;
    background: var(--border-color);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
}

.btn-close:hover {
    background: var(--primary-color);
    color: white;
}
</style>
