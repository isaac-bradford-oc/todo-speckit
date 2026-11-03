/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  resetTestDatabase,
  registerUser,
  createList,
  createTodo,
} from "./helpers.js";

describe("Feature 3 — Todos API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const { authHeader, user } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const response = await createTodo(authHeader, list.body.id, "Buy milk");

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        listId: list.body.id,
        title: "Buy milk",
        completed: false,
        userId: user.userId,
      });

      const todoRecord = await db.todo.findByPk(response.body.id);
      expect(todoRecord).not.toBeNull();
      expect(todoRecord.title).toBe("Buy milk");
      expect(todoRecord.completed).toBe(false);
      expect(todoRecord.userId).toBe(user.userId);
    });

    it("User adds a todo with an empty title", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const response = await createTodo(authHeader, list.body.id, "   ");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Todo title is required." });
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      const listA = await createList(userA.authHeader, "Work");
      const listB = await createList(userB.authHeader, "Work");

      await createTodo(userA.authHeader, listA.body.id, "My task");
      await createTodo(userB.authHeader, listB.body.id, "Their task");

      const response = await request(app)
        .get(`/todo/lists/${listA.body.id}/todos`)
        .set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("My task");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);

      const record = await db.todo.findByPk(todo.body.id);
      expect(record.completed).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");

      await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ completed: true });

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ completed: false });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);

      const record = await db.todo.findByPk(todo.body.id);
      expect(record.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ title: "Buy oat milk" });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Buy oat milk");

      const record = await db.todo.findByPk(todo.body.id);
      expect(record.title).toBe("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .delete(`/todo/todos/${todo.body.id}`)
        .set(authHeader);

      expect([200, 204]).toContain(response.status);

      const record = await db.todo.findByPk(todo.body.id);
      expect(record).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      const listB = await createList(userB.authHeader, "Secret");
      await createTodo(userB.authHeader, listB.body.id, "Hidden task");

      const response = await request(app)
        .get(`/todo/lists/${listB.body.id}/todos`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `List with id=${listB.body.id} not found.`,
      });
    });

    it("User attempts to add a todo to another user's list", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      const listB = await createList(userB.authHeader, "Secret");

      const response = await request(app)
        .post(`/todo/lists/${listB.body.id}/todos`)
        .set(userA.authHeader)
        .send({ title: "Intruder task" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `List with id=${listB.body.id} not found.`,
      });

      const todos = await db.todo.findAll({ where: { listId: listB.body.id } });
      expect(todos).toHaveLength(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      const listB = await createList(userB.authHeader, "Secret");
      const todoB = await createTodo(userB.authHeader, listB.body.id, "Original");

      const response = await request(app)
        .put(`/todo/todos/${todoB.body.id}`)
        .set(userA.authHeader)
        .send({ title: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `Todo with id=${todoB.body.id} not found.`,
      });

      const record = await db.todo.findByPk(todoB.body.id);
      expect(record.title).toBe("Original");
    });

    it("User attempts to delete another user's todo", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      const listB = await createList(userB.authHeader, "Secret");
      const todoB = await createTodo(userB.authHeader, listB.body.id, "Original");

      const response = await request(app)
        .delete(`/todo/todos/${todoB.body.id}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `Todo with id=${todoB.body.id} not found.`,
      });

      const record = await db.todo.findByPk(todoB.body.id);
      expect(record).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const listA = await createList(userA.authHeader, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${listA.body.id}/todos`)
        .set(userA.authHeader)
        .send({ title: "Buy milk", userId: 999 });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userA.user.userId);

      const record = await db.todo.findByPk(response.body.id);
      expect(record.userId).toBe(userA.user.userId);
    });

    it("Unauthenticated API request for todos", async () => {
      const response = await request(app).get("/todo/lists/1/todos");

      expect(response.status).toBe(401);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const todo1 = await createTodo(authHeader, list.body.id, "Buy milk");
      const todo2 = await createTodo(authHeader, list.body.id, "Buy eggs");

      await request(app).delete(`/todo/lists/${list.body.id}`).set(authHeader);

      const check1 = await db.todo.findByPk(todo1.body.id);
      const check2 = await db.todo.findByPk(todo2.body.id);

      expect(check1).toBeNull();
      expect(check2).toBeNull();
    });
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const { authHeader, user } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const response = await createTodo(
        authHeader,
        list.body.id,
        "Buy milk",
        "2026-07-15"
      );

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBe("2026-07-15");

      const record = await db.todo.findByPk(response.body.id);
      expect(record.dueDate).toBe("2026-07-15");
    });

    it("User adds a todo without a due date", async () => {
      const { authHeader, user } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const response = await createTodo(authHeader, list.body.id, "Buy milk");

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBeNull();

      const record = await db.todo.findByPk(response.body.id);
      expect(record.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on create", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader)
        .send({ title: "Task", dueDate: "not-a-date" });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Due date/i);

      const count = await db.todo.count({ where: { listId: list.body.id } });
      expect(count).toBe(0);
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ dueDate: "2026-07-20" });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBe("2026-07-20");

      const record = await db.todo.findByPk(todo.body.id);
      expect(record.dueDate).toBe("2026-07-20");
    });

    it("User clears a due date when editing a todo", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(
        authHeader,
        list.body.id,
        "Buy milk",
        "2026-07-20"
      );

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ dueDate: null });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBeNull();

      const record = await db.todo.findByPk(todo.body.id);
      expect(record.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on update", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ dueDate: "2026-99-99" });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Due date/i);
    });

    it("User cannot set due date on another user's todo", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      const listB = await createList(userB.authHeader, "Secret");
      const todoB = await createTodo(userB.authHeader, listB.body.id, "Task");

      const response = await request(app)
        .put(`/todo/todos/${todoB.body.id}`)
        .set(userA.authHeader)
        .send({ dueDate: "2026-07-15" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `Todo with id=${todoB.body.id} not found.`,
      });

      const record = await db.todo.findByPk(todoB.body.id);
      expect(record.dueDate).toBeNull();
    });
  });
});
