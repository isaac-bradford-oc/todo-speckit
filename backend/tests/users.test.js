/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  resetTestDatabase,
  registerUser,
  updateProfile,
} from "./helpers.js";

describe("Feature 4 — Users API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-4.2 — Edit profile & self-access", () => {
    it("User fetches their own profile", async () => {
      const { authHeader, user } = await registerUser();

      const response = await request(app)
        .get(`/todo/users/${user.userId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.userId,
        fName: "Test",
        lName: "User",
        email: "test@example.com",
        username: "testuser",
        role: "worker",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      const response = await request(app)
        .get(`/todo/users/${userB.user.userId}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `User with id=${userB.user.userId} not found.`,
      });
    });

    it("Unauthenticated profile API request", async () => {
      const response = await request(app).get("/todo/users/1");

      expect(response.status).toBe(401);
    });

    it("User saves profile changes", async () => {
      const { authHeader, user } = await registerUser();

      const response = await updateProfile(authHeader, user.userId, {
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "janedoe",
        password: "newpassword123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.userId,
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "janedoe",
        role: "worker",
      });
      expect(response.body.password).toBeUndefined();

      const record = await db.user.unscoped().findByPk(user.userId);
      expect(record.fName).toBe("Jane");
      expect(record.lName).toBe("Doe");
      expect(record.email).toBe("jane@example.com");
      expect(record.username).toBe("janedoe");
      expect(await bcrypt.compare("newpassword123", record.password)).toBe(true);
    });

    it("User attempts to update another user's profile", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      const userB = await registerUser({ username: "userb", email: "b@example.com" });

      const response = await updateProfile(userA.authHeader, userB.user.userId, {
        fName: "Hacked",
        lName: "User",
        email: "hacked@example.com",
        username: "hacked",
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `User with id=${userB.user.userId} not found.`,
      });

      const record = await db.user.findByPk(userB.user.userId);
      expect(record.username).toBe("userb");
    });

    it("Profile update rejects a password that is too short", async () => {
      const { authHeader, user } = await registerUser();

      const response = await updateProfile(authHeader, user.userId, {
        fName: "Test",
        lName: "User",
        email: "test@example.com",
        username: "testuser",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Password must be at least 8 characters.",
      });
    });

    it("Profile update rejects missing required fields", async () => {
      const { authHeader, user } = await registerUser();

      const response = await updateProfile(authHeader, user.userId, {
        lName: "User",
        email: "test@example.com",
        username: "testuser",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "First name is required.",
      });
    });

    it("Profile update rejects a duplicate username", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      await registerUser({ username: "userb", email: "b@example.com" });

      const response = await updateProfile(userA.authHeader, userA.user.userId, {
        fName: "Test",
        lName: "User",
        email: "a@example.com",
        username: "userb",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Username is already taken.",
      });
    });

    it("Profile update rejects a duplicate email", async () => {
      const userA = await registerUser({ username: "usera", email: "a@example.com" });
      await registerUser({ username: "userb", email: "b@example.com" });

      const response = await updateProfile(userA.authHeader, userA.user.userId, {
        fName: "Test",
        lName: "User",
        email: "b@example.com",
        username: "usera",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Email is already registered.",
      });
    });

    it("Unauthenticated profile update API request", async () => {
      const response = await request(app).put("/todo/users/1").send({
        fName: "Test",
        lName: "User",
        email: "test@example.com",
        username: "testuser",
      });

      expect(response.status).toBe(401);
    });
  });
});
