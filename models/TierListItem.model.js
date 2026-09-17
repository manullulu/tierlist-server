const { Schema, model } = require("mongoose");

const tierListItemSchema = new Schema(
  {
    tierList: {
      type: Schema.Types.ObjectId,
      ref: "TierList",
      required: true,
    },
    gameId: {
      type: Number,
      required: [true, "The RAWG id of the game is required."],
    },
    gameName: {
      type: String,
      required: [true, "The game name is required."],
    },
    gameImage: {
      type: String,
      default: "",
    },
    tier: {
      type: String,
      default: "unranked",
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const TierListItem = model("TierListItem", tierListItemSchema);

module.exports = TierListItem;
