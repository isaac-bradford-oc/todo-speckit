import db from "../models/index.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const Todo = db.todo;

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const isValidDateString = (str) => {
  if (typeof str !== "string" || !DATE_ONLY_REGEX.test(str)) return false;
  const [year, month, day] = str.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const findAllForList = async (req, res) => {
  const { listId } = req.params;

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todos = await Todo.findAll({
      where: {
        listId,
        userId: req.user.id,
      },
      order: [
        ["completed", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    return res.status(200).send(todos);
  } catch (error) {
    return res.status(500).send({ message: error.message || "Error retrieving todos." });
  }
};

export const create = async (req, res) => {
  const { listId } = req.params;

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";

    if (!title) {
      return res.status(400).send({ message: "Todo title is required." });
    }

    if (title.length > 255) {
      return res.status(400).send({ message: "Todo title must be 255 characters or fewer." });
    }

    let dueDate = null;
    if (req.body.dueDate !== undefined && req.body.dueDate !== null && req.body.dueDate !== "") {
      if (!isValidDateString(req.body.dueDate)) {
        return res.status(400).send({
          message: "Due date must be a valid date in YYYY-MM-DD format.",
        });
      }
      dueDate = req.body.dueDate;
    }

    const todo = await Todo.create({
      listId: Number(listId),
      title,
      completed: false,
      dueDate,
      userId: req.user.id,
    });

    return res.status(201).send(todo);
  } catch (error) {
    return res.status(500).send({ message: error.message || "Error creating todo." });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;

  try {
    const todo = await getAccessibleTodoOrNull(req, id);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${id} not found.` });
    }

    if (req.body.title !== undefined) {
      const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
      if (!title) {
        return res.status(400).send({ message: "Todo title is required." });
      }
      if (title.length > 255) {
        return res.status(400).send({ message: "Todo title must be 255 characters or fewer." });
      }
      todo.title = title;
    }

    if (req.body.completed !== undefined) {
      todo.completed = Boolean(req.body.completed);
    }

    if (req.body.dueDate !== undefined) {
      if (req.body.dueDate === null || req.body.dueDate === "") {
        todo.dueDate = null;
      } else {
        if (!isValidDateString(req.body.dueDate)) {
          return res.status(400).send({
            message: "Due date must be a valid date in YYYY-MM-DD format.",
          });
        }
        todo.dueDate = req.body.dueDate;
      }
    }

    await todo.save();

    return res.status(200).send(todo);
  } catch (error) {
    return res.status(500).send({ message: error.message || "Error updating todo." });
  }
};

export const deleteTodo = async (req, res) => {
  const { id } = req.params;

  try {
    const todo = await getAccessibleTodoOrNull(req, id);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${id} not found.` });
    }

    await todo.destroy();
    return res.status(200).send({ message: "Todo was deleted successfully!" });
  } catch (error) {
    return res.status(500).send({ message: error.message || "Error deleting todo." });
  }
};

export default {
  findAllForList,
  create,
  update,
  delete: deleteTodo,
};
