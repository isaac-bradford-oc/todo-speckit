import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import db from "../models/index.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const User = db.user;
const SALT_ROUNDS = 10;

export const getUser = async (req, res) => {
  const userId = Number(req.params.id);

  if (userId !== req.user.id) {
    return res.status(404).send({ message: `User with id=${req.params.id} not found.` });
  }

  try {
    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${req.params.id} not found.` });
    }

    return res.status(200).send({
      id: user.id,
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    return res.status(500).send({ message: error.message || "Error retrieving profile." });
  }
};

export const updateUser = async (req, res) => {
  const userId = Number(req.params.id);

  if (userId !== req.user.id) {
    return res.status(404).send({ message: `User with id=${req.params.id} not found.` });
  }

  try {
    const user = await User.unscoped().findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${req.params.id} not found.` });
    }

    const fName = typeof req.body.fName === "string" ? req.body.fName.trim() : "";
    const lName = typeof req.body.lName === "string" ? req.body.lName.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const password = req.body.password;

    if (!fName) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (!lName) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (!email) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (!username) {
      return res.status(400).send({ message: "Username is required." });
    }

    if (password !== undefined && password !== null && password !== "") {
      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).send({ message: "Password must be at least 8 characters." });
      }
      user.password = bcrypt.hashSync(password, SALT_ROUNDS);
    }

    const normalizedUsername = username.toLowerCase();

    // Check duplicate username
    const existingUsername = await User.findOne({
      where: {
        username: normalizedUsername,
        id: { [Op.ne]: userId },
      },
    });
    if (existingUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: userId },
      },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    user.fName = fName;
    user.lName = lName;
    user.email = email;
    user.username = normalizedUsername;

    await user.save();

    return res.status(200).send({
      id: user.id,
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    return res.status(500).send({ message: error.message || "Error updating profile." });
  }
};

export default {
  getUser,
  updateUser,
};
