const { z } = require("zod");

// Un vote : 1 (pouce en haut) ou -1 (pouce en bas)
const voteSchema = z.object({
  value: z.literal([1, -1], "The vote value must be 1 or -1."),
});

module.exports = { voteSchema };
