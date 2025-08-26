import { body } from "express-validator";

export const validateCreateAccount = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .matches(/^[a-zA-Z. ]+$/)
    .withMessage("Name can contain only letters, spaces and dots"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),
  body("password")
  .if(body("googleId").not().exists())// password is mandatory if no Google Id is present
  .trim()
  .notEmpty()
  .withMessage("Password is required when Google Id is not present")
];
