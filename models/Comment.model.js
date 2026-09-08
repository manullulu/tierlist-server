const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    tierList: {
      type: Schema.Types.ObjectId,
      ref: "TierList",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Le commentaire ne peut pas être vide."],
      trim: true,
      maxlength: [500, "Le commentaire ne peut pas dépasser 500 caractères."],
    },
  },
  {
    timestamps: true,
  }
);

const Comment = model("Comment", commentSchema);

module.exports = Comment;
