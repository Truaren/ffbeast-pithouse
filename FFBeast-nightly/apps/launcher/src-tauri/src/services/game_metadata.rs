use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameMetadata {
    pub name: String,
    pub steam_id: Option<u32>,
    pub cover_url: Option<String>,
    pub header_url: Option<String>,
    pub description: Option<String>,
    pub genres: Vec<String>,
}

/// Fetches game metadata from Steam Store API
pub async fn fetch_steam_metadata(app_id: u32) -> Result<GameMetadata> {
    let url = format!(
        "https://store.steampowered.com/api/appdetails?appids={}",
        app_id
    );

    let response = reqwest::get(&url).await?;
    let json: serde_json::Value = response.json().await?;

    let app_data = json
        .get(&app_id.to_string())
        .and_then(|v| v.get("data"))
        .ok_or_else(|| anyhow::anyhow!("Invalid response from Steam API"))?;

    let name = app_data
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown")
        .to_string();

    let cover_url = app_data
        .get("header_image")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let description = app_data
        .get("short_description")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let genres = app_data
        .get("genres")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|g| g.get("description").and_then(|d| d.as_str()))
                .map(|s| s.to_string())
                .collect()
        })
        .unwrap_or_default();

    Ok(GameMetadata {
        name,
        steam_id: Some(app_id),
        cover_url: cover_url.clone(),
        header_url: cover_url,
        description,
        genres,
    })
}

/// Searches for games by name using Steam Web API search
pub async fn search_steam_games(query: &str) -> Result<Vec<(u32, String)>> {
    // Use Steam store search API (more reliable than community endpoint)
    let url = format!(
        "https://store.steampowered.com/api/storesearch/?term={}&l=english&cc=US",
        urlencoding::encode(query)
    );

    let response = reqwest::get(&url).await?;
    
    #[derive(Deserialize)]
    struct SearchResponse {
        items: Option<Vec<SearchItem>>,
    }
    
    #[derive(Deserialize)]
    struct SearchItem {
        id: u32,
        name: String,
        #[serde(rename = "type")]
        item_type: String,
    }

    let search_response: SearchResponse = response.json().await?;
    
    if let Some(items) = search_response.items {
        let mut games = Vec::new();
        
        for item in items.into_iter().filter(|item| item.item_type == "app").take(20) {
            // Validate each result is actually a game via Store API
            if is_actually_game(item.id).await {
                games.push((item.id, item.name));
                
                // Limit to 10 actual games
                if games.len() >= 10 {
                    break;
                }
            }
        }
        
        Ok(games)
    } else {
        Ok(vec![])
    }
}

/// Validates if an app_id is actually a game (not tool/DLC) via Store API
async fn is_actually_game(app_id: u32) -> bool {
    let url = format!("https://store.steampowered.com/api/appdetails?appids={}", app_id);
    
    if let Ok(response) = reqwest::get(&url).await {
        if let Ok(json) = response.json::<serde_json::Value>().await {
            if let Some(app_data) = json.get(&app_id.to_string()) {
                if let Some(success) = app_data.get("success").and_then(|v| v.as_bool()) {
                    if success {
                        if let Some(data) = app_data.get("data") {
                            if let Some(app_type) = data.get("type").and_then(|v| v.as_str()) {
                                return app_type == "game";
                            }
                        }
                    }
                }
            }
        }
    }
    false
}
