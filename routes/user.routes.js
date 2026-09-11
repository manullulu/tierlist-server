const express = require("express");

const User = require("../models/User.model");

const router = express.Router();

// GET /api/users/:id - Le profil public d'un utilisateur (sans email ni mot de passe)
router.get("/:id", async (req, res, next) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable." });
      return;
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
