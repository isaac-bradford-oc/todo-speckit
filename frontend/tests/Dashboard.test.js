/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

describe("Feature 2 — Dashboard Lists Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      listServices.getLists.mockResolvedValue({
        data: [
          { id: 1, name: "Personal", userId: 1 },
          { id: 2, name: "Work", userId: 1 },
        ],
      });

      const { wrapper } = await mountWithPlugins(Dashboard);
      await flushPromises();

      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.text()).toContain("Work");
    });

    it("User has no lists", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });

      const { wrapper } = await mountWithPlugins(Dashboard);
      await flushPromises();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      listServices.getLists.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });

      const { wrapper } = await mountWithPlugins(Dashboard);
      await flushPromises();

      const editBtn = wrapper.find('button[aria-label="Edit list"]');
      const deleteBtn = wrapper.find('button[aria-label="Delete list"]');

      expect(editBtn.exists()).toBe(true);
      expect(deleteBtn.exists()).toBe(true);
    });
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });
      listServices.createList.mockResolvedValue({
        data: { id: 10, name: "Groceries", userId: 1 },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      const newBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().includes("+ New List")
      );
      await newBtn.trigger("click");
      await flushPromises();

      const textField = wrapper.findComponent({ name: "VTextField" });
      await textField.vm.$emit("update:modelValue", "Groceries");
      await flushPromises();

      const createBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Create"
      );
      await createBtn.trigger("click");
      await flushPromises();

      expect(listServices.createList).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
    });

    it("User creates a list with an empty name", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      const newBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().includes("+ New List")
      );
      await newBtn.trigger("click");
      await flushPromises();

      const createBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Create"
      );
      await createBtn.trigger("click");
      await flushPromises();

      expect(listServices.createList).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain("List name is required.");
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      listServices.getLists.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      listServices.updateList.mockResolvedValue({
        data: { id: 1, name: "Shopping", userId: 1 },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      const editBtn = wrapper.find('button[aria-label="Edit list"]');
      await editBtn.trigger("click");
      await flushPromises();

      const textFields = wrapper.findAllComponents({ name: "VTextField" });
      const editField = textFields[textFields.length - 1];
      await editField.vm.$emit("update:modelValue", "Shopping");
      await flushPromises();

      const saveBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Save"
      );
      await saveBtn.trigger("click");
      await flushPromises();

      expect(listServices.updateList).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
    });

    it("User deletes a list", async () => {
      listServices.getLists.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      listServices.deleteList.mockResolvedValue({ data: { message: "Deleted" } });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      const deleteBtn = wrapper.find('button[aria-label="Delete list"]');
      await deleteBtn.trigger("click");
      await flushPromises();

      const confirmDeleteBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
        b.text().trim() === "Delete"
      );
      await confirmDeleteBtn.trigger("click");
      await flushPromises();

      expect(listServices.deleteList).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Groceries");
    });
  });
});
