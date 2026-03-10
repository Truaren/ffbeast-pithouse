import "./style.scss";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useTitleBar } from "@/components/layout/TitleBarContext";
import { Button } from "@/components/ui";

// Types for our fetched data API
interface FetchedGame {
  id: string;
  name: string;
  image: string;
}

interface FetchedReview {
  id: string;
  game: string;
  wheelDetection: string;
  ffbStatus: string;
  tweaksRequired: string;
  devices: string;
  description: string;
  user: string;
  version: string;
  timestamp: string;
}

// Our internal game representation
interface GameData {
  title: string;
  image: string;
  reviewsCount: number;
  statusLevel: string;
  statusText: string;
  tweaksIndicator: { text: string; color: string };
  wheelText: string;
  ffbText: string;
  devices: string[];
}

export const GameCompatibility = () => {
  const [gamesList, setGamesList] = useState<GameData[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGameReviews, setSelectedGameReviews] = useState<{
    title: string;
    reviews: FetchedReview[];
  } | null>(null);
  const [allReviews, setAllReviews] = useState<FetchedReview[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    gameName: "",
    gameVersion: "",
    wheelDetection: "",
    ffbQuality: "",
    usedAdditionalDevices: "",
    additionalDevices: [] as string[],
    requiresAdditionalSettings: "",
    additionalSettingsText: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch games and reviews from our Cloudflare Worker proxy
  const fetchDiscordData = useCallback(
    async (forceUpdate = false) => {
      if (!forceUpdate && gamesList.length === 0) {
        setIsLoadingGames(true);
      }
      if (forceUpdate) setIsUpdating(true);

      try {
        if (!forceUpdate) {
          const cachedGames = localStorage.getItem("ffbeast_games_cache");
          const cachedReviews = localStorage.getItem("ffbeast_reviews_cache");
          const cachedLastUpdated = localStorage.getItem(
            "ffbeast_games_last_updated",
          );

          if (cachedGames && cachedReviews && cachedLastUpdated) {
            setGamesList(JSON.parse(cachedGames) as GameData[]);
            setAllReviews(JSON.parse(cachedReviews) as FetchedReview[]);
            setLastUpdated(cachedLastUpdated);
            setIsLoadingGames(false);
            return;
          }
        }

        const [gamesRes, reviewsRes] = await Promise.all([
          fetch("https://summer-snowflake-b8f7.trueaaren.workers.dev/games"),
          fetch("https://summer-snowflake-b8f7.trueaaren.workers.dev/reviews"),
        ]);

        if (!gamesRes.ok) throw new Error("Failed to fetch games");
        // Reviews might fail but we shouldn't break the whole app
        let allReviewsData: FetchedReview[] = [];
        if (reviewsRes.ok) {
          const reviewsData = (await reviewsRes.json()) as {
            reviews: FetchedReview[];
          };
          allReviewsData = reviewsData.reviews;
          setAllReviews(allReviewsData);
        }

        const gamesData = (await gamesRes.json()) as { games: FetchedGame[] };

        // Map remote data to our UI structure
        const mappedGames: GameData[] = gamesData.games.map((g) => {
          const gameTitleLower = g.name.toLowerCase().trim();
          const gameReviews = allReviewsData.filter(
            (r) => r.game?.toLowerCase().trim() === gameTitleLower,
          );

          let statusLevel = "unknown";
          let statusText = "No data yet";
          let tweaksIndicator = { text: "No Data", color: "gray" };
          let ffbText = "Unknown";
          let wheelText = "Unknown";
          const allDevices = new Set<string>();

          if (gameReviews.length > 0) {
            let native = 0;
            let good = 0;
            let bad = 0;
            let tweaksCount = 0;

            gameReviews.forEach((r) => {
              // Rating calculation
              if (r.wheelDetection === "No") bad++;
              else if (
                r.wheelDetection === "Yes" &&
                r.ffbStatus === "Works correctly"
              )
                native++;
              else if (
                r.wheelDetection === "Yes" &&
                r.ffbStatus === "Has issues"
              )
                good++;
              else if (r.wheelDetection === "Yes" && r.ffbStatus === "No FFB")
                bad++;

              if (r.tweaksRequired?.startsWith("Yes")) tweaksCount++;

              if (
                r.devices &&
                r.devices !== "None" &&
                r.devices !== "Unknown"
              ) {
                r.devices.split(",").forEach((d) => allDevices.add(d.trim()));
              }
            });

            // Calculate overall rating majority
            const max = Math.max(native, good, bad);
            if (max === native && native > 0) {
              statusLevel = "native";
              statusText = "Native";
            } else if (max === good && good > 0) {
              statusLevel = "good";
              statusText = "Good";
            } else if (max === bad && bad > 0) {
              statusLevel = "bad";
              statusText = "Bad";
            }

            // Tweaks logic
            if (tweaksCount / gameReviews.length >= 0.3) {
              tweaksIndicator = { text: "Tweaks Required", color: "yellow" };
            } else {
              tweaksIndicator = { text: "No Tweaks Needed", color: "green" };
            }

            // Majority values for Wheel and FFB
            wheelText =
              gameReviews.filter((r) => r.wheelDetection === "Yes").length >=
              gameReviews.length / 2
                ? "Yes"
                : "No";
            const ffbWorks = gameReviews.filter(
              (r) => r.ffbStatus === "Works correctly",
            ).length;
            const ffbIssues = gameReviews.filter(
              (r) => r.ffbStatus === "Has issues",
            ).length;
            const ffbNone = gameReviews.filter(
              (r) => r.ffbStatus === "No FFB",
            ).length;
            const ffbMax = Math.max(ffbWorks, ffbIssues, ffbNone);
            if (ffbMax === ffbWorks) ffbText = "Works correctly";
            else if (ffbMax === ffbIssues) ffbText = "Has issues";
            else if (ffbMax === ffbNone && ffbNone > 0) ffbText = "No FFB";
            else ffbText = "Unknown";
          }

          return {
            title: g.name,
            image:
              g.image || "https://placehold.co/600x300/333/FFF?text=No+Image",
            reviewsCount: gameReviews.length,
            statusLevel,
            statusText,
            tweaksIndicator,
            wheelText,
            ffbText,
            devices: Array.from(allDevices),
          };
        });

        // Sort alphabetically
        mappedGames.sort((a, b) => a.title.localeCompare(b.title));

        setGamesList(mappedGames);
        const now = new Date().toLocaleString();
        setLastUpdated(now);

        localStorage.setItem(
          "ffbeast_games_cache",
          JSON.stringify(mappedGames),
        );
        localStorage.setItem(
          "ffbeast_reviews_cache",
          JSON.stringify(allReviewsData),
        );
        localStorage.setItem("ffbeast_games_last_updated", now);

        // Populate the first game name in the feedback modal safely
        if (mappedGames.length > 0) {
          setFormData((prev) => ({ ...prev, gameName: mappedGames[0].title }));
        }
      } catch (err) {
        console.error("Error fetching Discord data:", err);
        toast.error("Failed to load games list.");
      } finally {
        setIsLoadingGames(false);
        setIsUpdating(false);
      }
    },
    [gamesList.length],
  );

  const { setExtraContent } = useTitleBar();

  useEffect(() => {
    void fetchDiscordData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setExtraContent(
      <>
        {lastUpdated && (
          <span
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            Updated: {lastUpdated}
          </span>
        )}
        <Button
          variant="secondary"
          onClick={() => fetchDiscordData(true)}
          disabled={isUpdating || isLoadingGames}
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
        <input
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            flex: 1,
            minWidth: "150px",
            maxWidth: "300px",
          }}
        />
      </>,
    );

    return () => setExtraContent(null);
  }, [
    lastUpdated,
    isUpdating,
    isLoadingGames,
    searchQuery,
    setExtraContent,
    fetchDiscordData,
  ]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const workerUrl =
      "https://summer-snowflake-b8f7.trueaaren.workers.dev/reviews";

    try {
      const devices =
        formData.usedAdditionalDevices === "Yes" &&
        formData.additionalDevices.length > 0
          ? formData.additionalDevices.join(", ")
          : "None";
      const settings =
        formData.requiresAdditionalSettings === "Yes"
          ? `Yes\n${formData.additionalSettingsText}`
          : "No";

      const payload = {
        embeds: [
          {
            title: formData.gameName,
            description: formData.description || "No description provided.",
            color: formData.wheelDetection === "Yes" ? 0x00ff00 : 0xff0000,
            author: {
              name: formData.username || "Anonymous",
            },
            fields: [
              {
                name: "Game Version",
                value: formData.gameVersion || "Not specified",
                inline: true,
              },
              {
                name: "Wheel Detection",
                value: formData.wheelDetection || "Not specified",
                inline: true,
              },
              {
                name: "FFB Status",
                value: formData.ffbQuality || "Not specified",
                inline: true,
              },
              { name: "Tweaks Required", value: settings, inline: false },
              { name: "Used Devices", value: devices, inline: false },
            ],
          },
        ],
      };

      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Feedback successfully submitted!");
        setIsModalOpen(false);
        setFormData({
          username: "",
          gameName: gamesList[0]?.title || "",
          gameVersion: "",
          wheelDetection: "",
          ffbQuality: "",
          usedAdditionalDevices: "",
          additionalDevices: [],
          requiresAdditionalSettings: "",
          additionalSettingsText: "",
          description: "",
        });
      } else {
        toast.error("Submit error: " + res.status);
      }
    } catch (err) {
      toast.error("Connection error.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGames = gamesList.filter((game) =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="game-compatibility-page">
      <div className="container">
        {isLoadingGames ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--text-secondary)",
            }}
          >
            Loading games from Discord...
          </div>
        ) : filteredGames.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--text-secondary)",
            }}
          >
            No games found matching your search.
          </div>
        ) : (
          filteredGames.map((game, idx) => (
            <div
              className="game-card"
              key={idx}
              onClick={() => {
                if (game.reviewsCount > 0) {
                  const gameReviews = allReviews.filter(
                    (r) =>
                      r.game.toLowerCase().trim() ===
                      game.title.toLowerCase().trim(),
                  );
                  // Sort by newest if there's a timestamp, otherwise leave as is. Let's assume Discord messages ID can sort.
                  gameReviews.sort((a, b) => b.id.localeCompare(a.id));
                  setSelectedGameReviews({
                    title: game.title,
                    reviews: gameReviews,
                  });
                }
              }}
              style={{ cursor: game.reviewsCount > 0 ? "pointer" : "default" }}
            >
              <div
                className="game-image"
                style={{ backgroundImage: `url('${game.image}')` }}
              ></div>
              <div className="game-content">
                <div>
                  <h2 className="game-title">{game.title}</h2>
                </div>
                <div
                  className="game-stats"
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span
                    style={{
                      color: game.reviewsCount > 0 ? "#4CAF50" : "inherit",
                      textDecoration:
                        game.reviewsCount > 0 ? "underline" : "none",
                    }}
                  >
                    {game.reviewsCount} user reviews
                  </span>
                  <div
                    style={{
                      width: "1px",
                      height: "12px",
                      backgroundColor: "var(--border)",
                    }}
                  ></div>
                  <button
                    className="card-feedback-btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((prev) => ({
                        ...prev,
                        gameName: game.title,
                      }));
                      setIsModalOpen(true);
                    }}
                    title="Submit Feedback for this game"
                  >
                    Feedback
                  </button>
                </div>
              </div>
              <div className="right-panel">
                <div
                  style={{
                    display: "inline-block",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor:
                      game.statusLevel === "native"
                        ? "#4CAF50"
                        : game.statusLevel === "good"
                          ? "#8BC34A"
                          : game.statusLevel === "bad"
                            ? "#F44336"
                            : "#9E9E9E",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  AVERAGE COMPATIBILITY: {game.statusText.toUpperCase()}
                </div>

                <div
                  style={{
                    fontSize: "0.9rem",
                    marginTop: "1rem",
                    color: "var(--text-secondary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: "bold",
                      color:
                        game.tweaksIndicator.color === "green"
                          ? "#4CAF50"
                          : game.tweaksIndicator.color === "yellow"
                            ? "#FFC107"
                            : "gray",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor:
                          game.tweaksIndicator.color === "green"
                            ? "#4CAF50"
                            : game.tweaksIndicator.color === "yellow"
                              ? "#FFC107"
                              : "gray",
                      }}
                    ></span>
                    {game.tweaksIndicator.text}
                  </div>

                  {game.devices.length > 0 && (
                    <div style={{ marginTop: "0.4rem" }}>
                      <strong>Tested devices:</strong>
                      <ul
                        style={{
                          paddingLeft: "1.2rem",
                          margin: "0.2rem 0 0 0",
                        }}
                      >
                        {game.devices.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <h2>Game Feedback</h2>
            <form onSubmit={handleReportSubmit}>
              <div className="form-group">
                <label>Your Name (Optional)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Anonymous"
                />
              </div>

              <div className="form-group">
                <label>Select Game</label>
                <select
                  value={formData.gameName}
                  onChange={(e) =>
                    setFormData({ ...formData, gameName: e.target.value })
                  }
                  required
                >
                  {gamesList.length === 0 && (
                    <option value="" disabled>
                      No games available
                    </option>
                  )}
                  {gamesList.map((g) => (
                    <option key={g.title} value={g.title}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Game Version</label>
                <select
                  value={formData.gameVersion}
                  onChange={(e) =>
                    setFormData({ ...formData, gameVersion: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Select option...
                  </option>
                  <option value="Licensed">Licensed (Steam/Epic etc.)</option>
                  <option value="Pirated">Pirated / Repack</option>
                </select>
              </div>

              <div className="form-group">
                <label>Does the game detect your wheel?</label>
                <select
                  value={formData.wheelDetection}
                  onChange={(e) =>
                    setFormData({ ...formData, wheelDetection: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Select option...
                  </option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group">
                <label>Force Feedback status</label>
                <select
                  value={formData.ffbQuality}
                  onChange={(e) =>
                    setFormData({ ...formData, ffbQuality: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Select option...
                  </option>
                  <option value="Works correctly">Works correctly</option>
                  <option value="Has issues">Has issues</option>
                  <option value="No FFB">No FFB</option>
                </select>
              </div>

              <div className="form-group">
                <label>Did you use additional devices?</label>
                <select
                  value={formData.usedAdditionalDevices}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usedAdditionalDevices: e.target.value,
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    Select option...
                  </option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {formData.usedAdditionalDevices === "Yes" && (
                <div className="form-group">
                  <div className="checkbox-group">
                    {["Load Cell Pedals", "Handbrake", "H-Shifter"].map(
                      (dev) => (
                        <label key={dev} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.additionalDevices.includes(dev)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  additionalDevices: [
                                    ...formData.additionalDevices,
                                    dev,
                                  ],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  additionalDevices:
                                    formData.additionalDevices.filter(
                                      (d) => d !== dev,
                                    ),
                                });
                              }
                            }}
                          />{" "}
                          {dev}
                        </label>
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Are tweaks required?</label>
                <select
                  value={formData.requiresAdditionalSettings}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requiresAdditionalSettings: e.target.value,
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    Select option...
                  </option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {formData.requiresAdditionalSettings === "Yes" && (
                <div className="form-group">
                  <textarea
                    value={formData.additionalSettingsText}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        additionalSettingsText: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Describe the tweaks required. Example: Needed to edit config file to enable proper FFB."
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Describe your experience</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  placeholder="Example: Game works perfectly out of the box... Wheel detected immediately..."
                  required
                />
              </div>

              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  className="button_comp primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedGameReviews && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedGameReviews(null);
          }}
        >
          <div
            className="modal-content"
            style={{ maxHeight: "90vh", overflowY: "auto", maxWidth: "800px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2>Reviews for {selectedGameReviews.title}</h2>
              <Button
                variant="secondary"
                onClick={() => setSelectedGameReviews(null)}
              >
                Close
              </Button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {selectedGameReviews.reviews.length === 0 ? (
                <p>No reviews available yet.</p>
              ) : (
                selectedGameReviews.reviews.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: "1rem",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "8px",
                      borderLeft:
                        r.wheelDetection === "Yes"
                          ? "4px solid #4CAF50"
                          : "4px solid #F44336",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <strong style={{ fontSize: "1.1rem" }}>
                        {r.user || "Anonymous"}
                      </strong>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {r.version || "Unknown Version"}
                      </span>
                    </div>
                    <p style={{ marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
                      {r.description}
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <div>
                        <strong>Wheel Detected:</strong> {r.wheelDetection}
                      </div>
                      <div>
                        <strong>FFB:</strong> {r.ffbStatus}
                      </div>
                      <div>
                        <strong>Tweaks:</strong> {r.tweaksRequired}
                      </div>
                      <div>
                        <strong>Devices:</strong> {r.devices}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
