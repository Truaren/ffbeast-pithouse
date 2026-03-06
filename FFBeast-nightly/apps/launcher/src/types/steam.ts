export interface SteamGame {
    app_id: number;
    name: string;
    install_dir: string;
    executable: string | null;
    library_path: string;
}

export interface GameMetadata {
    name: string;
    steam_id: number | null;
    cover_url: string | null;
    header_url: string | null;
    description: string | null;
    genres: string[];
}

export interface SearchResult {
    appId: number;
    name: string;
}
