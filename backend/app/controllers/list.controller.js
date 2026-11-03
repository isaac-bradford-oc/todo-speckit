import db from "../models/index.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const List = db.list;

export const create = async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

  if (!name) {
    return res.status(400).send({ message: "List name is required." });
  }

  if (name.length > 100) {
    return res.status(400).send({ message: "List name must be 100 characters or fewer." });
  }

  try {
    const list = await List.create({
      name,
      userId: req.user.id,
    });

    return res.status(201).send(list);
  } catch (error) {
    return res.status(500).send({ message: error.message || "Error creating list." });
  }
};

export const findAll = async (req, res) => {
  try {
    const lists = await List.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });

    return res.status(200).send(lists);
  } catch (error) {
    return res.status(500).send({ message: error.message || "Error retrieving lists." });
  }
};

export const update = async (req, res) => {
  const { listId } = req.params;

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!name) {
      return res.status(400).send({ message: "List name is required." });
    }

    if (name.length > 100) {
      return res.status(400).send({ message: "List name must be 100 characters or fewer." });
    }

    list.name = name;
    await list.save();

    return res.status(200).send(list);
  } catch (error) {
    return res.status(500).send({ message: error.message || "Error updating list." });
  }
};

export const deleteList = async (req, res) => {
  const { listId } = req.params;

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    await list.destroy();
    return res.status(200).send({ message: "List was deleted successfully!" });
  } catch (error) {
    return res.status(500).send({ message: error.message || "Error deleting list." });
  }
};

export default {
  create,
  findAll,
  update,
  delete: deleteList,
};
