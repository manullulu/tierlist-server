const express = require("express");

const router = express.Router();

// Ces deux routes servent uniquement de relais vers l'API RAWG.
// Le React n'appelle jamais RAWG directement : la clé API reste côté serveur.

// GET /api/games/search?q=zelda - Recherche des jeux sur RAWG
router.get("/search", async (req, res, next) => {
  const query = req.query.q;

  if (!query || query.trim() === "") {
    res.status(400).json({ message: "Merci de saisir un terme de recherche." });
    return;
  }

  if (!process.env.RAWG_API_KEY) {
    res.status(500).json({ message: "La clé API RAWG n'est pas configurée sur le serveur." });
    return;
  }

  try {
    const url =
      "https://api.rawg.io/api/games?key=" +
      process.env.RAWG_API_KEY +
      "&search=" +
      encodeURIComponent(query) +
      "&page_size=12";

    const response = await fetch(url);

    if (!response.ok) {
      res.status(502).json({ message: "L'API RAWG n'a pas répondu correctement." });
      return;
    }

    const data = await response.json();

    const games = [];

    for (let i = 0; i < data.results.length; i++) {
      const game = data.results[i];
      games.push({
        gameId: game.id,
        name: game.name,
        image: game.background_image,
        released: game.released,
        rating: game.rating,
      });
    }

    res.status(200).json(games);
  } catch (error) {
    next(error);
  }
});

// GET /api/games/:gameId - Le détail d'un jeu RAWG
router.get("/:gameId", async (req, res, next) => {
  const gameId = req.params.gameId;

  if (!process.env.RAWG_API_KEY) {
    res.status(500).json({ message: "La clé API RAWG n'est pas configurée sur le serveur." });
    return;
  }

  try {
    const url = "https://api.rawg.io/api/games/" + gameId + "?key=" + process.env.RAWG_API_KEY;

    const response = await fetch(url);

    if (response.status === 404) {
      res.status(404).json({ message: "Jeu introuvable." });
      return;
    }

    if (!response.ok) {
      res.status(502).json({ message: "L'API RAWG n'a pas répondu correctement." });
      return;
    }

    const game = await response.json();

    const genres = [];
    if (game.genres) {
      for (let i = 0; i < game.genres.length; i++) {
        genres.push(game.genres[i].name);
      }
    }

    const platforms = [];
    if (game.platforms) {
      for (let i = 0; i < game.platforms.length; i++) {
        platforms.push(game.platforms[i].platform.name);
      }
    }

    res.status(200).json({
      gameId: game.id,
      name: game.name,
      image: game.background_image,
      released: game.released,
      rating: game.rating,
      description: game.description_raw,
      genres: genres,
      platforms: platforms,
      website: game.website,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
