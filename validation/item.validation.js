const { z } = require("zod");

// Pour ajouter un jeu dans une tier list
const addItemSchema = z.object({
  gameId: z.number("The id and the name of the game are required."),
  gameName: z
    .string("The id and the name of the game are required.")
    .trim()
    .min(1, "The id and the name of the game are required."),
  // RAWG ne fournit pas toujours d'image : elle peut être absente ou null
  gameImage: z.string().nullable().optional(),
  tier: z.string().optional(),
});

// Pour changer le rang ou la position d'un jeu
const updateItemSchema = z.object({
  tier: z.string().optional(),
  position: z
    .number("The position must be a number.")
    .int("The position must be a whole number.")
    .min(0, "The position cannot be negative.")
    .optional(),
});

module.exports = { addItemSchema, updateItemSchema };
