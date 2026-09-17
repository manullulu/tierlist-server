const jwt = require("jsonwebtoken");

// Middleware qui vérifie que la requête contient un token JWT valide.
// Si c'est le cas, on stocke le contenu du token dans req.payload.
function isAuthenticated(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    res.status(401).json({ message: "Missing token. You must be logged in." });
    return;
  }

  // Le header ressemble à : "Bearer eyJhbGciOi..."
  const parts = authorizationHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ message: "Invalid token format." });
    return;
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, process.env.TOKEN_SECRET);
    req.payload = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

// Middleware "optionnel" : si un token est présent et valide, on remplit req.payload,
// sinon on laisse passer quand même (utile pour les routes publiques qui affichent
// des choses différentes si l'utilisateur est connecté).
function readTokenIfPresent(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    next();
    return;
  }

  const parts = authorizationHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    next();
    return;
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, process.env.TOKEN_SECRET);
    req.payload = payload;
  } catch (error) {
    // token invalide : on ignore, l'utilisateur est considéré comme anonyme
  }

  next();
}

module.exports = { isAuthenticated, readTokenIfPresent };
