const { Schema, model } = require("mongoose");

const tierListSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre est obligatoire."],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    tiers: {
      type: [
        {
          label: { type: String, required: true },
          color: { type: String, required: true },
        },
      ],
      default: [
        { label: "S", color: "#FF7F7F" },
        { label: "A", color: "#FFBF7F" },
        { label: "B", color: "#FFDF7F" },
        { label: "C", color: "#FFFF7F" },
        { label: "D", color: "#BFFF7F" },
        { label: "F", color: "#7FFF7F" },
      ],
    },
  },
  {
    timestamps: true,
  }
);

const TierList = model("TierList", tierListSchema);

module.exports = TierList;
