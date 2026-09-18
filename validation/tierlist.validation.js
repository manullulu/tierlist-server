const { z } = require("zod");

// Un rang : un nom et une couleur
const tierSchema = z.object({
  label: z
    .string("Each rank needs a name.")
    .trim()
    .min(1, "Each rank needs a name.")
    .max(12, "A rank name cannot be longer than 12 characters."),
  color: z.string("Each rank needs a color."),
});

// Pour créer une tier list : le titre est obligatoire, le reste est facultatif
const createTierListSchema = z.object({
  title: z
    .string("The title is required.")
    .trim()
    .min(1, "The title is required.")
    .max(100, "The title cannot be longer than 100 characters."),
  description: z.string().max(500, "The description cannot be longer than 500 characters.").optional(),
  isPublic: z.boolean().optional(),
  tiers: z.array(tierSchema).min(2, "You need at least two ranks.").optional(),
});

// Pour modifier une tier list : tout est facultatif, on ne change que ce qui est envoyé
const updateTierListSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "The title is required.")
    .max(100, "The title cannot be longer than 100 characters.")
    .optional(),
  description: z.string().max(500, "The description cannot be longer than 500 characters.").optional(),
  isPublic: z.boolean().optional(),
  tiers: z.array(tierSchema).min(2, "You need at least two ranks.").optional(),
});

module.exports = { createTierListSchema, updateTierListSchema };
