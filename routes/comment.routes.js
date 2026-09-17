const express = require("express");

const TierList = require("../models/TierList.model");
const Comment = require("../models/Comment.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

const router = express.Router();

// GET /api/tierlists/:id/comments - Les commentaires d'une tier list
router.get("/tierlists/:id/comments", async (req, res, next) => {
  const tierListId = req.params.id;

  try {
    const comments = await Comment.find({ tierList: tierListId })
      .populate("author", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
});

// POST /api/tierlists/:id/comments - Ajoute un commentaire (connecté)
router.post("/tierlists/:id/comments", isAuthenticated, async (req, res, next) => {
  const tierListId = req.params.id;
  const content = req.body.content;

  if (!content || content.trim() === "") {
    res.status(400).json({ message: "The comment cannot be empty." });
    return;
  }

  if (content.length > 500) {
    res.status(400).json({ message: "The comment cannot be longer than 500 characters." });
    return;
  }

  try {
    const tierList = await TierList.findById(tierListId);

    if (!tierList) {
      res.status(404).json({ message: "Tier list not found." });
      return;
    }

    const createdComment = await Comment.create({
      tierList: tierListId,
      author: req.payload._id,
      content: content,
    });

    // On renvoie le commentaire avec les infos de l'auteur pour l'afficher directement
    const fullComment = await Comment.findById(createdComment._id).populate("author", "name avatar");

    res.status(201).json(fullComment);
  } catch (error) {
    next(error);
  }
});

// PUT /api/comments/:commentId - Modifie un commentaire (auteur uniquement)
router.put("/comments/:commentId", isAuthenticated, async (req, res, next) => {
  const commentId = req.params.commentId;
  const content = req.body.content;

  if (!content || content.trim() === "") {
    res.status(400).json({ message: "The comment cannot be empty." });
    return;
  }

  if (content.length > 500) {
    res.status(400).json({ message: "The comment cannot be longer than 500 characters." });
    return;
  }

  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({ message: "Comment not found." });
      return;
    }

    const isAuthor = comment.author.toString() === req.payload._id;

    if (!isAuthor) {
      res.status(403).json({ message: "You can only edit your own comments." });
      return;
    }

    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(commentId).populate("author", "name avatar");

    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/comments/:commentId - Supprime un commentaire (auteur ou admin)
router.delete("/comments/:commentId", isAuthenticated, async (req, res, next) => {
  const commentId = req.params.commentId;

  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({ message: "Comment not found." });
      return;
    }

    const isAuthor = comment.author.toString() === req.payload._id;
    const isAdmin = req.payload.role === "admin";

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ message: "You are not allowed to delete this comment." });
      return;
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: "Comment deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
