const { z } = require("zod");

// Ce que le client doit envoyer pour créer un compte
const signupSchema = z.object({
  email: z.email("The email address is not valid."),
  password: z
    .string("The password is required.")
    .min(6, "The password must be at least 6 characters long."),
  name: z.string("The name is required.").trim().min(1, "The name is required."),
  avatar: z.string().optional(),
});

// Ce que le client doit envoyer pour se connecter
const loginSchema = z.object({
  email: z
    .string("Please fill in the email and the password.")
    .min(1, "Please fill in the email and the password."),
  password: z
    .string("Please fill in the email and the password.")
    .min(1, "Please fill in the email and the password."),
});

module.exports = { signupSchema, loginSchema };
