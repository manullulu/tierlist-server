const { z } = require("zod");

// Un commentaire : un texte non vide de 500 caractères maximum
const commentSchema = z.object({
  content: z
    .string("The comment cannot be empty.")
    .trim()
    .min(1, "The comment cannot be empty.")
    .max(500, "The comment cannot be longer than 500 characters."),
});

module.exports = { commentSchema };
