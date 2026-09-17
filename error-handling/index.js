module.exports = (app) => {
  // Aucune route n'a répondu : 404
  app.use((req, res, next) => {
    res.status(404).json({ message: "This route does not exist." });
  });

  // Une route a appelé next(error) : erreur serveur
  app.use((err, req, res, next) => {
    console.error("ERREUR", req.method, req.path, err);

    // Erreur de validation Mongoose (champ requis, maxlength...)
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      res.status(400).json({ message: messages.join(" ") });
      return;
    }

    // Identifiant MongoDB mal formé
    if (err.name === "CastError") {
      res.status(400).json({ message: "Invalid id." });
      return;
    }

    // Doublon (email déjà utilisé, vote déjà enregistré...)
    if (err.code === 11000) {
      res.status(400).json({ message: "This value already exists." });
      return;
    }

    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error." });
    }
  });
};
