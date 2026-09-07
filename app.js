// Charge les variables du fichier .env dans process.env
require("dotenv").config();

// Connexion à MongoDB
require("./db");

const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares
// L'origine autorisée est le front React (http://localhost:5173 en local)
app.use(
  cors({
    origin: [process.env.ORIGIN || "http://localhost:5173"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Petite route pour vérifier que le serveur tourne
app.get("/", (req, res) => {
  res.json({ message: "API Tier Lists de jeux vidéo" });
});

// Gestion des erreurs (404 et 500) - toujours en dernier
require("./error-handling")(app);

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
