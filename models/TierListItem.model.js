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
      required: [true, "L'identifiant RAWG du jeu est obligatoire."],
    },
    gameName: {
      type: String,
      required: [true, "Le nom du jeu est obligatoire."],
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
