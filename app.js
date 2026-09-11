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

// Routes
const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const tierListRoutes = require("./routes/tierlist.routes");
app.use("/api/tierlists", tierListRoutes);

const itemRoutes = require("./routes/item.routes");
app.use("/api/tierlists", itemRoutes);

const voteRoutes = require("./routes/vote.routes");
app.use("/api/tierlists", voteRoutes);

const commentRoutes = require("./routes/comment.routes");
app.use("/api", commentRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

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
