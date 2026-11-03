import db from "../models/index.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const Todo = db.todo;

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

    const todoPayload = {
      listId: Number(listId),
      title,
      completed: false,
      userId: req.user.id,
    };

    if (req.body.dueDate !== undefined) {
      todoPayload.dueDate = req.body.dueDate;
    }

    const todo = await Todo.create(todoPayload);

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
      todo.dueDate = req.body.dueDate;
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
