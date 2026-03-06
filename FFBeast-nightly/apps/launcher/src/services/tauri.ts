import { invoke } from "@tauri-apps/api/core";
import { Game } from "../types";
import { SteamGame, GameMetadata } from "../types/steam";

export const GameService = {
    async getGames(): Promise<Game[]> {
        return await invoke("get_games");
    },

    async getGame(id: string): Promise<Game | null> {
        return await invoke("get_game", { id });
    },

    async saveGame(game: Game): Promise<void> {
        return await invoke("save_game", { game });
    },

    async deleteGame(id: string): Promise<void> {
        return await invoke("delete_game", { id });
    },

    async launchGame(id: string): Promise<void> {
        return await invoke("launch_game", { id });
    }
};

export const SteamService = {
    async scanLibrary(): Promise<SteamGame[]> {
        return await invoke("scan_steam_library");
    },

    async searchGames(query: string): Promise<[number, string][]> {
        return await invoke("search_games", { query });
    },

    async fetchMetadata(appId: number): Promise<GameMetadata> {
        return await invoke("fetch_game_metadata", { appId });
    }
};

export const HardwareService = {
    async checkConnection(): Promise<boolean> {
        return await invoke("check_hardware");
    },

    async resetCenter(): Promise<void> {
        return await invoke("reset_center");
    },

    async rebootDevice(): Promise<void> {
        return await invoke("reboot_device");
    }
};

export const SettingsService = {
    async getDefaultWheelSettings(): Promise<import("../types/settings").DefaultWheelSettings> {
        return await invoke("get_default_wheel_settings");
    },

    async saveDefaultWheelSettings(settings: import("../types/settings").DefaultWheelSettings): Promise<void> {
        return await invoke("save_default_wheel_settings", { settings });
    },

    async getGamepadMapping(): Promise<import("../types/settings").GamepadAxisMapping> {
        return await invoke("get_gamepad_mapping");
    },

    async saveGamepadMapping(mapping: import("../types/settings").GamepadAxisMapping): Promise<void> {
        return await invoke("save_gamepad_mapping", { mapping });
    },

    async applyWheelSettingsToHardware(settings: import("../types/settings").DefaultWheelSettings): Promise<void> {
        return await invoke("apply_wheel_settings_to_hardware", { settings });
    },

    async listProfiles(): Promise<import("../types/settings").Profile[]> {
        return await invoke("list_profiles");
    },

    async createProfile(name: string): Promise<string> {
        return await invoke("create_profile", { name });
    },

    async deleteProfile(id: string): Promise<void> {
        return await invoke("delete_profile", { id });
    },

    async setActiveProfile(id: string): Promise<void> {
        return await invoke("set_active_profile", { id });
    },

    async getActiveProfileId(): Promise<string | null> {
        return await invoke("get_active_profile_id");
    }
};
