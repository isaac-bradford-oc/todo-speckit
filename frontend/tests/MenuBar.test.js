/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import authServices from "../src/services/authServices.js";
import userServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const mockUser = {
  userId: 42,
  id: 42,
  fName: "Jane",
  lName: "Doe",
  username: "jdoe",
  email: "jane@example.com",
};

describe("Feature 4 — MenuBar & User Profile Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    localStorage.clear();
    Utils.setStore("user", mockUser);
  });

  const TestWrapper = {
    components: { MenuBar },
    template: "<v-layout><MenuBar /></v-layout>",
  };

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const { wrapper } = await mountWithPlugins(TestWrapper);
      await flushPromises();

      const signOutBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Sign out"
      );
      expect(signOutBtn).toBeUndefined();
    });
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      const { wrapper } = await mountWithPlugins(TestWrapper, {
        attachTo: document.body,
      });
      await flushPromises();

      const userIconBtn = wrapper.find('button[aria-label="User profile"]');
      expect(userIconBtn.exists()).toBe(true);

      await userIconBtn.trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("Jane Doe");
      expect(document.body.textContent).toContain("@jdoe");
      expect(document.body.textContent).toContain("jane@example.com");
      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.body.textContent).toContain("Log out");
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      const { wrapper } = await mountWithPlugins(TestWrapper, {
        attachTo: document.body,
      });
      await flushPromises();

      const userIconBtn = wrapper.find('button[aria-label="User profile"]');
      await userIconBtn.trigger("click");
      await flushPromises();

      const logoutBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().includes("Log out")
      );
      await logoutBtn.trigger("click");
      await flushPromises();

      expect(authServices.logoutUser).toHaveBeenCalled();
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const { wrapper } = await mountWithPlugins(TestWrapper, {
        attachTo: document.body,
      });
      await flushPromises();

      const userIconBtn = wrapper.find('button[aria-label="User profile"]');
      await userIconBtn.trigger("click");
      await flushPromises();

      const editProfileBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().includes("Edit Profile")
      );
      await editProfileBtn.trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("Edit Profile");
    });

    it("User cancels the edit profile dialog", async () => {
      const { wrapper } = await mountWithPlugins(TestWrapper, {
        attachTo: document.body,
      });
      await flushPromises();

      const userIconBtn = wrapper.find('button[aria-label="User profile"]');
      await userIconBtn.trigger("click");
      await flushPromises();

      const editProfileBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().includes("Edit Profile")
      );
      await editProfileBtn.trigger("click");
      await flushPromises();

      const cancelBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Cancel"
      );
      await cancelBtn.trigger("click");
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user")).toEqual(mockUser);
    });

    it("User saves profile changes", async () => {
      userServices.updateUser.mockResolvedValue({
        data: {
          id: 42,
          fName: "Janet",
          lName: "Doe",
          email: "janet@example.com",
          username: "janetd",
          role: "worker",
        },
      });

      const { wrapper } = await mountWithPlugins(TestWrapper, {
        attachTo: document.body,
      });
      await flushPromises();

      const userIconBtn = wrapper.find('button[aria-label="User profile"]');
      await userIconBtn.trigger("click");
      await flushPromises();

      const editProfileBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().includes("Edit Profile")
      );
      await editProfileBtn.trigger("click");
      await flushPromises();

      const textFields = wrapper.findAllComponents({ name: "VTextField" });
      await textFields[0].vm.$emit("update:modelValue", "Janet");
      await textFields[2].vm.$emit("update:modelValue", "janet@example.com");
      await textFields[3].vm.$emit("update:modelValue", "janetd");
      await flushPromises();

      const saveBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Save"
      );
      await saveBtn.trigger("click");
      await flushPromises();

      expect(userServices.updateUser).toHaveBeenCalledWith(42, {
        fName: "Janet",
        lName: "Doe",
        email: "janet@example.com",
        username: "janetd",
      });

      expect(Utils.getStore("user").fName).toBe("Janet");
    });

    it("User saves profile with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(TestWrapper, {
        attachTo: document.body,
      });
      await flushPromises();

      const userIconBtn = wrapper.find('button[aria-label="User profile"]');
      await userIconBtn.trigger("click");
      await flushPromises();

      const editProfileBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().includes("Edit Profile")
      );
      await editProfileBtn.trigger("click");
      await flushPromises();

      const textFields = wrapper.findAllComponents({ name: "VTextField" });
      await textFields[2].vm.$emit("update:modelValue", "notanemail");
      await flushPromises();

      const saveBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Save"
      );
      await saveBtn.trigger("click");
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain("Enter a valid email address.");
    });

    it("User saves profile with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(TestWrapper, {
        attachTo: document.body,
      });
      await flushPromises();

      const userIconBtn = wrapper.find('button[aria-label="User profile"]');
      await userIconBtn.trigger("click");
      await flushPromises();

      const editProfileBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().includes("Edit Profile")
      );
      await editProfileBtn.trigger("click");
      await flushPromises();

      const textFields = wrapper.findAllComponents({ name: "VTextField" });
      await textFields[4].vm.$emit("update:modelValue", "password123");
      await textFields[5].vm.$emit("update:modelValue", "different123");
      await flushPromises();

      const saveBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Save"
      );
      await saveBtn.trigger("click");
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain("Passwords do not match.");
    });

    it("User saves profile with a password that is too short", async () => {
      const { wrapper } = await mountWithPlugins(TestWrapper, {
        attachTo: document.body,
      });
      await flushPromises();

      const userIconBtn = wrapper.find('button[aria-label="User profile"]');
      await userIconBtn.trigger("click");
      await flushPromises();

      const editProfileBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().includes("Edit Profile")
      );
      await editProfileBtn.trigger("click");
      await flushPromises();

      const textFields = wrapper.findAllComponents({ name: "VTextField" });
      await textFields[4].vm.$emit("update:modelValue", "short");
      await textFields[5].vm.$emit("update:modelValue", "short");
      await flushPromises();

      const saveBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Save"
      );
      await saveBtn.trigger("click");
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
    });

    it("Profile update API returns an error", async () => {
      userServices.updateUser.mockRejectedValue({
        response: { data: { message: "Username is already taken." } },
      });

      const { wrapper } = await mountWithPlugins(TestWrapper, {
        attachTo: document.body,
      });
      await flushPromises();

      const userIconBtn = wrapper.find('button[aria-label="User profile"]');
      await userIconBtn.trigger("click");
      await flushPromises();

      const editProfileBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().includes("Edit Profile")
      );
      await editProfileBtn.trigger("click");
      await flushPromises();

      const saveBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Save"
      );
      await saveBtn.trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("Username is already taken.");
    });
  });
});
