const { Schema, model } = require("mongoose");

const voteSchema = new Schema(
  {
    tierList: {
      type: Schema.Types.ObjectId,
      ref: "TierList",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    value: {
      type: Number,
      enum: [1, -1],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Un utilisateur ne peut voter qu'une seule fois par tier list
voteSchema.index({ tierList: 1, user: 1 }, { unique: true });

const Vote = model("Vote", voteSchema);

module.exports = Vote;
