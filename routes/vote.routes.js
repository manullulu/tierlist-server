const express = require("express");

const TierList = require("../models/TierList.model");
const Vote = require("../models/Vote.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { voteSchema } = require("../validation/vote.validation");

const router = express.Router();

// POST /api/tierlists/:id/vote - Vote pour une tier list (connecté)
// Si l'utilisateur a déjà voté, son vote est remplacé (upsert)
router.post("/:id/vote", isAuthenticated, async (req, res, next) => {
  const tierListId = req.params.id;

  // On vérifie les données envoyées avec le schéma zod
  const validation = voteSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ message: validation.error.issues[0].message });
    return;
  }

  const value = validation.data.value;

  try {
    const tierList = await TierList.findById(tierListId);

    if (!tierList) {
      res.status(404).json({ message: "Tier list not found." });
      return;
    }

    const existingVote = await Vote.findOne({ tierList: tierListId, user: req.payload._id });

    if (existingVote) {
      existingVote.value = value;
      await existingVote.save();
    } else {
      await Vote.create({
        tierList: tierListId,
        user: req.payload._id,
        value: value,
      });
    }

    // On recalcule le score pour le renvoyer au client
    const votes = await Vote.find({ tierList: tierListId });

    let score = 0;
    let upvotes = 0;
    let downvotes = 0;

    for (let i = 0; i < votes.length; i++) {
      score = score + votes[i].value;
      if (votes[i].value === 1) {
        upvotes = upvotes + 1;
      } else {
        downvotes = downvotes + 1;
      }
    }

    res.status(200).json({
      score: score,
      upvotes: upvotes,
      downvotes: downvotes,
      myVote: value,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tierlists/:id/vote - Retire son vote (connecté)
router.delete("/:id/vote", isAuthenticated, async (req, res, next) => {
  const tierListId = req.params.id;

  try {
    await Vote.findOneAndDelete({ tierList: tierListId, user: req.payload._id });

    const votes = await Vote.find({ tierList: tierListId });

    let score = 0;
    let upvotes = 0;
    let downvotes = 0;

    for (let i = 0; i < votes.length; i++) {
      score = score + votes[i].value;
      if (votes[i].value === 1) {
        upvotes = upvotes + 1;
      } else {
        downvotes = downvotes + 1;
      }
    }

    res.status(200).json({
      score: score,
      upvotes: upvotes,
      downvotes: downvotes,
      myVote: 0,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
