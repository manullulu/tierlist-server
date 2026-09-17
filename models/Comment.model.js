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
      required: [true, "The comment cannot be empty."],
      trim: true,
      maxlength: [500, "The comment cannot be longer than 500 characters."],
    },
  },
  {
    timestamps: true,
  }
);

const Comment = model("Comment", commentSchema);

module.exports = Comment;
