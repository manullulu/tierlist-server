const express = require("express");

const TierList = require("../models/TierList.model");
const TierListItem = require("../models/TierListItem.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

const router = express.Router();

// POST /api/tierlists/:id/items - Ajoute un jeu à une tier list (propriétaire ou admin)
router.post("/:id/items", isAuthenticated, async (req, res, next) => {
  const tierListId = req.params.id;
  const gameId = req.body.gameId;
  const gameName = req.body.gameName;
  const gameImage = req.body.gameImage;
  const tier = req.body.tier;

  if (!gameId || !gameName) {
    res.status(400).json({ message: "L'identifiant et le nom du jeu sont obligatoires." });
    return;
  }

  try {
    const tierList = await TierList.findById(tierListId);

    if (!tierList) {
      res.status(404).json({ message: "Tier list introuvable." });
      return;
    }

    const isOwner = tierList.owner.toString() === req.payload._id;
    const isAdmin = req.payload.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: "Vous n'avez pas le droit de modifier cette tier list." });
      return;
    }

    // On refuse d'ajouter deux fois le même jeu
    const alreadyThere = await TierListItem.findOne({ tierList: tierListId, gameId: gameId });

    if (alreadyThere) {
      res.status(400).json({ message: "Ce jeu est déjà dans la tier list." });
      return;
    }

    let chosenTier = "unranked";
    if (tier) {
      chosenTier = tier;
    }

    // Le nouveau jeu va à la fin de son rang
    const itemsInSameTier = await TierListItem.countDocuments({
      tierList: tierListId,
      tier: chosenTier,
    });

    const createdItem = await TierListItem.create({
      tierList: tierListId,
      gameId: gameId,
      gameName: gameName,
      gameImage: gameImage || "",
      tier: chosenTier,
      position: itemsInSameTier,
    });

    res.status(201).json(createdItem);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tierlists/:id/items/:itemId - Change le rang ou la position d'un jeu
router.put("/:id/items/:itemId", isAuthenticated, async (req, res, next) => {
  const tierListId = req.params.id;
  const itemId = req.params.itemId;
  const tier = req.body.tier;
  const position = req.body.position;

  try {
    const tierList = await TierList.findById(tierListId);

    if (!tierList) {
      res.status(404).json({ message: "Tier list introuvable." });
      return;
    }

    const isOwner = tierList.owner.toString() === req.payload._id;
    const isAdmin = req.payload.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: "Vous n'avez pas le droit de modifier cette tier list." });
      return;
    }

    const item = await TierListItem.findById(itemId);

    if (!item || item.tierList.toString() !== tierListId) {
      res.status(404).json({ message: "Jeu introuvable dans cette tier list." });
      return;
    }

    if (tier !== undefined) {
      // On vérifie que le rang existe bien dans cette tier list
      let tierExists = false;
      if (tier === "unranked") {
        tierExists = true;
      }
      for (let i = 0; i < tierList.tiers.length; i++) {
        if (tierList.tiers[i].label === tier) {
          tierExists = true;
        }
      }

      if (!tierExists) {
        res.status(400).json({ message: "Ce rang n'existe pas dans cette tier list." });
        return;
      }

      // Si le jeu change de rang, il se place à la fin du nouveau rang
      if (tier !== item.tier) {
        const itemsInNewTier = await TierListItem.countDocuments({
          tierList: tierListId,
          tier: tier,
        });
        item.position = itemsInNewTier;
      }

      item.tier = tier;
    }

    if (position !== undefined) {
      item.position = position;
    }

    const updatedItem = await item.save();

    res.status(200).json(updatedItem);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tierlists/:id/items/:itemId - Retire un jeu de la tier list
router.delete("/:id/items/:itemId", isAuthenticated, async (req, res, next) => {
  const tierListId = req.params.id;
  const itemId = req.params.itemId;

  try {
    const tierList = await TierList.findById(tierListId);

    if (!tierList) {
      res.status(404).json({ message: "Tier list introuvable." });
      return;
    }

    const isOwner = tierList.owner.toString() === req.payload._id;
    const isAdmin = req.payload.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: "Vous n'avez pas le droit de modifier cette tier list." });
      return;
    }

    const item = await TierListItem.findById(itemId);

    if (!item || item.tierList.toString() !== tierListId) {
      res.status(404).json({ message: "Jeu introuvable dans cette tier list." });
      return;
    }

    await TierListItem.findByIdAndDelete(itemId);

    res.status(200).json({ message: "Jeu retiré de la tier list." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
