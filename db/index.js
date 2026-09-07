const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tierlist-server";

mongoose
  .connect(MONGODB_URI)
  .then((x) => {
    const databaseName = x.connections[0].name;
    console.log(`Connecté à MongoDB ! Base de données : "${databaseName}"`);
  })
  .catch((err) => {
    console.error("Erreur de connexion à MongoDB : ", err);
  });
