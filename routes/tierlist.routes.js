const express = require("express");

const TierList = require("../models/TierList.model");
const TierListItem = require("../models/TierListItem.model");
const Vote = require("../models/Vote.model");
const Comment = require("../models/Comment.model");
const { isAuthenticated, readTokenIfPresent } = require("../middleware/jwt.middleware");

const router = express.Router();

// GET /api/tierlists - Toutes les tier lists publiques, avec recherche et tri
// Exemples : /api/tierlists?search=zelda   /api/tierlists?sort=popular
router.get("/", async (req, res, next) => {
  const search = req.query.search;
  const sort = req.query.sort;

  try {
    const filter = { isPublic: true };

    if (search) {
      // Recherche insensible à la casse dans le titre
      filter.title = { $regex: search, $options: "i" };
    }

    const tierLists = await TierList.find(filter)
      .populate("owner", "name avatar")
      .sort({ createdAt: -1 });

    // Pour chaque tier list, on calcule le score (votes) et le nombre de jeux
    const results = [];

    for (let i = 0; i < tierLists.length; i++) {
      const tierList = tierLists[i];

      const votes = await Vote.find({ tierList: tierList._id });
      let score = 0;
      for (let j = 0; j < votes.length; j++) {
        score = score + votes[j].value;
      }

      const itemsCount = await TierListItem.countDocuments({ tierList: tierList._id });

      // On récupère les 4 premiers jeux pour afficher un aperçu sur la carte
      const previewItems = await TierListItem.find({ tierList: tierList._id })
        .sort({ tier: 1, position: 1 })
        .limit(4);

      results.push({
        _id: tierList._id,
        title: tierList.title,
        description: tierList.description,
        owner: tierList.owner,
        isPublic: tierList.isPublic,
        tiers: tierList.tiers,
        createdAt: tierList.createdAt,
        score: score,
        itemsCount: itemsCount,
        previewItems: previewItems,
      });
    }

    if (sort === "popular") {
      results.sort((a, b) => b.score - a.score);
    }

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
});

// GET /api/tierlists/user/:userId - Les tier lists d'un utilisateur
// Si l'utilisateur connecté regarde sa propre page, il voit aussi ses listes privées
router.get("/user/:userId", readTokenIfPresent, async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const filter = { owner: userId };

    let isOwner = false;
    if (req.payload && req.payload._id === userId) {
      isOwner = true;
    }

    if (!isOwner) {
      filter.isPublic = true;
    }

    const tierLists = await TierList.find(filter)
      .populate("owner", "name avatar")
      .sort({ createdAt: -1 });

    const results = [];

    for (let i = 0; i < tierLists.length; i++) {
      const tierList = tierLists[i];

      const votes = await Vote.find({ tierList: tierList._id });
      let score = 0;
      for (let j = 0; j < votes.length; j++) {
        score = score + votes[j].value;
      }

      const itemsCount = await TierListItem.countDocuments({ tierList: tierList._id });

      const previewItems = await TierListItem.find({ tierList: tierList._id })
        .sort({ tier: 1, position: 1 })
        .limit(4);

      results.push({
        _id: tierList._id,
        title: tierList.title,
        description: tierList.description,
        owner: tierList.owner,
        isPublic: tierList.isPublic,
        tiers: tierList.tiers,
        createdAt: tierList.createdAt,
        score: score,
        itemsCount: itemsCount,
        previewItems: previewItems,
      });
    }

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
});

// GET /api/tierlists/:id - Une tier list complète avec ses items et ses votes
router.get("/:id", readTokenIfPresent, async (req, res, next) => {
  const tierListId = req.params.id;

  try {
    const tierList = await TierList.findById(tierListId).populate("owner", "name avatar");

    if (!tierList) {
      res.status(404).json({ message: "Tier list introuvable." });
      return;
    }

    // Une liste privée n'est visible que par son propriétaire ou un admin
    if (!tierList.isPublic) {
      let allowed = false;

      if (req.payload) {
        if (req.payload._id === tierList.owner._id.toString()) {
          allowed = true;
        }
        if (req.payload.role === "admin") {
          allowed = true;
        }
      }

      if (!allowed) {
        res.status(403).json({ message: "Cette tier list est privée." });
        return;
      }
    }

    const items = await TierListItem.find({ tierList: tierListId }).sort({ position: 1 });

    const votes = await Vote.find({ tierList: tierListId });

    let score = 0;
    let upvotes = 0;
    let downvotes = 0;
    let myVote = 0;

    for (let i = 0; i < votes.length; i++) {
      score = score + votes[i].value;

      if (votes[i].value === 1) {
        upvotes = upvotes + 1;
      } else {
        downvotes = downvotes + 1;
      }

      if (req.payload && votes[i].user.toString() === req.payload._id) {
        myVote = votes[i].value;
      }
    }

    res.status(200).json({
      _id: tierList._id,
      title: tierList.title,
      description: tierList.description,
      owner: tierList.owner,
      isPublic: tierList.isPublic,
      tiers: tierList.tiers,
      createdAt: tierList.createdAt,
      items: items,
      votes: {
        score: score,
        upvotes: upvotes,
        downvotes: downvotes,
        myVote: myVote,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tierlists - Crée une tier list (connecté)
router.post("/", isAuthenticated, async (req, res, next) => {
  const title = req.body.title;
  const description = req.body.description;
  const isPublic = req.body.isPublic;
  const tiers = req.body.tiers;

  if (!title) {
    res.status(400).json({ message: "Le titre est obligatoire." });
    return;
  }

  try {
    const newTierList = {
      title: title,
      description: description || "",
      owner: req.payload._id,
    };

    if (isPublic === false) {
      newTierList.isPublic = false;
    }

    // Si le client envoie des tiers personnalisés, on les utilise, sinon Mongoose met ceux par défaut
    if (tiers && tiers.length > 0) {
      newTierList.tiers = tiers;
    }

    const createdTierList = await TierList.create(newTierList);

    res.status(201).json(createdTierList);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tierlists/:id - Modifie une tier list (propriétaire ou admin)
router.put("/:id", isAuthenticated, async (req, res, next) => {
  const tierListId = req.params.id;
  const title = req.body.title;
  const description = req.body.description;
  const isPublic = req.body.isPublic;
  const tiers = req.body.tiers;

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

    if (title !== undefined) {
      tierList.title = title;
    }
    if (description !== undefined) {
      tierList.description = description;
    }
    if (isPublic !== undefined) {
      tierList.isPublic = isPublic;
    }
    if (tiers !== undefined && tiers.length > 0) {
      tierList.tiers = tiers;

      // Si un rang a été supprimé, les jeux qui étaient dedans repassent en "unranked"
      const labels = [];
      for (let i = 0; i < tiers.length; i++) {
        labels.push(tiers[i].label);
      }

      const items = await TierListItem.find({ tierList: tierListId });
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.tier !== "unranked" && !labels.includes(item.tier)) {
          item.tier = "unranked";
          await item.save();
        }
      }
    }

    const updatedTierList = await tierList.save();

    res.status(200).json(updatedTierList);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tierlists/:id - Supprime une tier list (propriétaire ou admin)
router.delete("/:id", isAuthenticated, async (req, res, next) => {
  const tierListId = req.params.id;

  try {
    const tierList = await TierList.findById(tierListId);

    if (!tierList) {
      res.status(404).json({ message: "Tier list introuvable." });
      return;
    }

    const isOwner = tierList.owner.toString() === req.payload._id;
    const isAdmin = req.payload.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: "Vous n'avez pas le droit de supprimer cette tier list." });
      return;
    }

    // On supprime aussi tout ce qui dépend de la tier list
    await TierListItem.deleteMany({ tierList: tierListId });
    await Vote.deleteMany({ tierList: tierListId });
    await Comment.deleteMany({ tierList: tierListId });
    await TierList.findByIdAndDelete(tierListId);

    res.status(200).json({ message: "Tier list supprimée." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
