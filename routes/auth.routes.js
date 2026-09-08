const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

const router = express.Router();

const saltRounds = 10;

// POST /auth/signup - Crée un nouvel utilisateur
router.post("/signup", async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const avatar = req.body.avatar;

  // Vérification des champs obligatoires
  if (!email || !password || !name) {
    res.status(400).json({ message: "Merci de remplir l'email, le mot de passe et le nom." });
    return;
  }

  // Vérification du format de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "L'adresse email n'est pas valide." });
    return;
  }

  // Vérification de la longueur du mot de passe
  if (password.length < 6) {
    res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
    return;
  }

  try {
    // On vérifie que l'email n'est pas déjà pris
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      res.status(400).json({ message: "Cet email est déjà utilisé." });
      return;
    }

    // On hashe le mot de passe avant de le stocker
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const createdUser = await User.create({
      email: email,
      password: hashedPassword,
      name: name,
      avatar: avatar || "",
    });

    // On ne renvoie jamais le mot de passe au client
    const user = {
      _id: createdUser._id,
      email: createdUser.email,
      name: createdUser.name,
      avatar: createdUser.avatar,
      role: createdUser.role,
    };

    res.status(201).json({ user: user });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login - Vérifie les identifiants et renvoie un token JWT
router.post("/login", async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).json({ message: "Merci de remplir l'email et le mot de passe." });
    return;
  }

  try {
    const foundUser = await User.findOne({ email: email });

    if (!foundUser) {
      res.status(401).json({ message: "Email ou mot de passe incorrect." });
      return;
    }

    const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

    if (!passwordCorrect) {
      res.status(401).json({ message: "Email ou mot de passe incorrect." });
      return;
    }

    // Les informations que l'on met dans le token
    const payload = {
      _id: foundUser._id,
      email: foundUser.email,
      name: foundUser.name,
      avatar: foundUser.avatar,
      role: foundUser.role,
    };

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "6h",
    });

    res.status(200).json({ authToken: authToken });
  } catch (error) {
    next(error);
  }
});

// GET /auth/verify - Vérifie que le token est valide et renvoie son contenu
router.get("/verify", isAuthenticated, (req, res, next) => {
  res.status(200).json(req.payload);
});

module.exports = router;
