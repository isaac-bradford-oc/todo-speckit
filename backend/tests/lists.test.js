/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser, createList } from "./helpers.js";

describe("Feature 2 — Lists API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const { authHeader, user } = await registerUser();

      const response = await createList(authHeader, "Groceries");

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: "Groceries",
        userId: user.userId,
      });

      const listRecord = await db.list.findByPk(response.body.id);
      expect(listRecord).not.toBeNull();
      expect(listRecord.name).toBe("Groceries");
      expect(listRecord.userId).toBe(user.userId);
    });

    it("User creates a list with an empty name", async () => {
      const { authHeader } = await registerUser();

      const response = await createList(authHeader, "   ");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "List name is required." });
    });

    it("User creates a list with a name that is too long", async () => {
      const { authHeader } = await registerUser();
      const longName = "a".repeat(101);

      const response = await createList(authHeader, longName);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "List name must be 100 characters or fewer.",
      });
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const { authHeader } = await registerUser();

      await createList(authHeader, "Work");
      await createList(authHeader, "Personal");

      const response = await request(app).get("/todo/lists").set(authHeader);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      // Alphabetical order: Personal, then Work
      expect(response.body[0].name).toBe("Personal");
      expect(response.body[1].name).toBe("Work");
    });

    it("User cannot see another user's lists", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      await createList(userB.authHeader, "Secret Project");
      await createList(userA.authHeader, "User A List");

      const response = await request(app).get("/todo/lists").set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("User A List");
      expect(response.body.some((l) => l.name === "Secret Project")).toBe(false);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const { authHeader } = await registerUser();
      const created = await createList(authHeader, "Groceries");

      const response = await request(app)
        .put(`/todo/lists/${created.body.id}`)
        .set(authHeader)
        .send({ name: "Shopping" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Shopping");

      const updated = await db.list.findByPk(created.body.id);
      expect(updated.name).toBe("Shopping");
    });

    it("User deletes a list", async () => {
      const { authHeader } = await registerUser();
      const created = await createList(authHeader, "Groceries");

      const response = await request(app)
        .delete(`/todo/lists/${created.body.id}`)
        .set(authHeader);

      expect([200, 204]).toContain(response.status);

      const record = await db.list.findByPk(created.body.id);
      expect(record).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      const bList = await createList(userB.authHeader, "B List");

      const response = await request(app)
        .put(`/todo/lists/${bList.body.id}`)
        .set(userA.authHeader)
        .send({ name: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `List with id=${bList.body.id} not found.`,
      });

      const check = await db.list.findByPk(bList.body.id);
      expect(check.name).toBe("B List");
    });

    it("User attempts to delete another user's list", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      const bList = await createList(userB.authHeader, "B List");

      const response = await request(app)
        .delete(`/todo/lists/${bList.body.id}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `List with id=${bList.body.id} not found.`,
      });

      const check = await db.list.findByPk(bList.body.id);
      expect(check).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });

      const response = await request(app)
        .post("/todo/lists")
        .set(userA.authHeader)
        .send({ name: "Groceries", userId: 999 });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userA.user.userId);

      const record = await db.list.findByPk(response.body.id);
      expect(record.userId).toBe(userA.user.userId);
    });

    it("Unauthenticated API request to lists", async () => {
      const response = await request(app).get("/todo/lists");

      expect(response.status).toBe(401);
    });
  });
});
