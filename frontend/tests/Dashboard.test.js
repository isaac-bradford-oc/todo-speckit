/**
 * Feature 2 & 3 — Todo List & Item Management
 * Specs:
 * - features/feature-2-todo-list-management.md
 * - features/feature-3-todo-list-item-management.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import todoServices from "../src/services/todoServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
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

describe("Feature 3 — Dashboard Items Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("Add item is only available inside the items dialog", async () => {
    listServices.getLists.mockResolvedValue({
      data: [{ id: 1, name: "Groceries", userId: 1 }],
    });

    const { wrapper } = await mountWithPlugins(Dashboard);
    await flushPromises();

    expect(wrapper.text()).not.toContain("+ Add Item");
  });

  it("List items dialog shows empty state", async () => {
    listServices.getLists.mockResolvedValue({
      data: [{ id: 1, name: "Personal", userId: 1 }],
    });
    todoServices.getTodos.mockResolvedValue({ data: [] });

    const { wrapper } = await mountWithPlugins(Dashboard, {
      attachTo: document.body,
    });
    await flushPromises();

    const itemsBtn = wrapper.find('button[aria-label="Items"]');
    await itemsBtn.trigger("click");
    await flushPromises();

    expect(todoServices.getTodos).toHaveBeenCalledWith(1);
    expect(document.body.textContent).toContain("No todos in this list yet.");
  });

  it("User opens items for different lists", async () => {
    listServices.getLists.mockResolvedValue({
      data: [
        { id: 1, name: "Personal", userId: 1 },
        { id: 2, name: "Work", userId: 1 },
      ],
    });
    todoServices.getTodos.mockImplementation((listId) => {
      if (listId === 1) {
        return Promise.resolve({
          data: [{ id: 101, title: "Call mom", completed: false, listId: 1 }],
        });
      }
      return Promise.resolve({
        data: [
          { id: 201, title: "Email client", completed: false, listId: 2 },
          { id: 202, title: "Write report", completed: false, listId: 2 },
        ],
      });
    });

    const { wrapper } = await mountWithPlugins(Dashboard, {
      attachTo: document.body,
    });
    await flushPromises();

    const itemsBtns = wrapper.findAll('button[aria-label="Items"]');

    // Open Personal items
    await itemsBtns[0].trigger("click");
    await flushPromises();

    expect(document.body.textContent).toContain("Call mom");
    expect(document.body.textContent).not.toContain("Email client");

    // Close items dialog
    const closeBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
      b.text().trim() === "Close"
    );
    await closeBtn.trigger("click");
    await flushPromises();

    // Open Work items
    await itemsBtns[1].trigger("click");
    await flushPromises();

    expect(document.body.textContent).toContain("Email client");
    expect(document.body.textContent).toContain("Write report");
  });

  it("User adds a todo to a list via dialog", async () => {
    listServices.getLists.mockResolvedValue({
      data: [{ id: 1, name: "Groceries", userId: 1 }],
    });
    todoServices.getTodos.mockResolvedValue({ data: [] });
    todoServices.createTodo.mockResolvedValue({
      data: { id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 },
    });

    const { wrapper } = await mountWithPlugins(Dashboard, {
      attachTo: document.body,
    });
    await flushPromises();

    const itemsBtn = wrapper.find('button[aria-label="Items"]');
    await itemsBtn.trigger("click");
    await flushPromises();

    const addItemBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
      b.text().includes("+ Add Item")
    );
    await addItemBtn.trigger("click");
    await flushPromises();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const addInput = textFields[textFields.length - 1];
    await addInput.vm.$emit("update:modelValue", "Buy milk");
    await flushPromises();

    const addConfirmBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
      b.text().trim() === "Add"
    );
    await addConfirmBtn.trigger("click");
    await flushPromises();

    expect(todoServices.createTodo).toHaveBeenCalledWith(1, { title: "Buy milk" });
    expect(document.body.textContent).toContain("Buy milk");
  });

  it("User adds a todo with an empty title", async () => {
    listServices.getLists.mockResolvedValue({
      data: [{ id: 1, name: "Groceries", userId: 1 }],
    });
    todoServices.getTodos.mockResolvedValue({ data: [] });

    const { wrapper } = await mountWithPlugins(Dashboard, {
      attachTo: document.body,
    });
    await flushPromises();

    const itemsBtn = wrapper.find('button[aria-label="Items"]');
    await itemsBtn.trigger("click");
    await flushPromises();

    const addItemBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
      b.text().includes("+ Add Item")
    );
    await addItemBtn.trigger("click");
    await flushPromises();

    const addConfirmBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
      b.text().trim() === "Add"
    );
    await addConfirmBtn.trigger("click");
    await flushPromises();

    expect(todoServices.createTodo).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("Todo title is required.");
  });

  it("User marks a todo as complete", async () => {
    listServices.getLists.mockResolvedValue({
      data: [{ id: 1, name: "Groceries", userId: 1 }],
    });
    todoServices.getTodos.mockResolvedValue({
      data: [{ id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 }],
    });
    todoServices.updateTodo.mockResolvedValue({
      data: { id: 10, title: "Buy milk", completed: true, listId: 1, userId: 1 },
    });

    const { wrapper } = await mountWithPlugins(Dashboard, {
      attachTo: document.body,
    });
    await flushPromises();

    const itemsBtn = wrapper.find('button[aria-label="Items"]');
    await itemsBtn.trigger("click");
    await flushPromises();

    const checkbox = wrapper.findComponent({ name: "VCheckboxBtn" });
    await checkbox.vm.$emit("update:modelValue", true);
    await flushPromises();

    expect(todoServices.updateTodo).toHaveBeenCalledWith(10, { completed: true });
  });

  it("User marks a completed todo as incomplete", async () => {
    listServices.getLists.mockResolvedValue({
      data: [{ id: 1, name: "Groceries", userId: 1 }],
    });
    todoServices.getTodos.mockResolvedValue({
      data: [{ id: 10, title: "Buy milk", completed: true, listId: 1, userId: 1 }],
    });
    todoServices.updateTodo.mockResolvedValue({
      data: { id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 },
    });

    const { wrapper } = await mountWithPlugins(Dashboard, {
      attachTo: document.body,
    });
    await flushPromises();

    const itemsBtn = wrapper.find('button[aria-label="Items"]');
    await itemsBtn.trigger("click");
    await flushPromises();

    const checkbox = wrapper.findComponent({ name: "VCheckboxBtn" });
    await checkbox.vm.$emit("update:modelValue", false);
    await flushPromises();

    expect(todoServices.updateTodo).toHaveBeenCalledWith(10, { completed: false });
  });

  it("User edits a todo title", async () => {
    listServices.getLists.mockResolvedValue({
      data: [{ id: 1, name: "Groceries", userId: 1 }],
    });
    todoServices.getTodos.mockResolvedValue({
      data: [{ id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 }],
    });
    todoServices.updateTodo.mockResolvedValue({
      data: { id: 10, title: "Buy oat milk", completed: false, listId: 1, userId: 1 },
    });

    const { wrapper } = await mountWithPlugins(Dashboard, {
      attachTo: document.body,
    });
    await flushPromises();

    const itemsBtn = wrapper.find('button[aria-label="Items"]');
    await itemsBtn.trigger("click");
    await flushPromises();

    const editItemBtn = document.querySelector('button[aria-label="Edit item"]');
    editItemBtn.click();
    await flushPromises();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const editInput = textFields[textFields.length - 1];
    await editInput.vm.$emit("update:modelValue", "Buy oat milk");
    await flushPromises();

    const saveBtns = wrapper.findAllComponents({ name: "VBtn" }).filter((b) =>
      b.text().trim() === "Save"
    );
    const saveBtn = saveBtns[saveBtns.length - 1];
    await saveBtn.trigger("click");
    await flushPromises();

    expect(todoServices.updateTodo).toHaveBeenCalledWith(10, { title: "Buy oat milk" });
    expect(document.body.textContent).toContain("Buy oat milk");
  });

  it("User deletes a todo", async () => {
    listServices.getLists.mockResolvedValue({
      data: [{ id: 1, name: "Groceries", userId: 1 }],
    });
    todoServices.getTodos.mockResolvedValue({
      data: [{ id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 }],
    });
    todoServices.deleteTodo.mockResolvedValue({ data: { message: "Deleted" } });

    const { wrapper } = await mountWithPlugins(Dashboard, {
      attachTo: document.body,
    });
    await flushPromises();

    const itemsBtn = wrapper.find('button[aria-label="Items"]');
    await itemsBtn.trigger("click");
    await flushPromises();

    const deleteItemBtn = document.querySelector('button[aria-label="Delete item"]');
    deleteItemBtn.click();
    await flushPromises();

    const deleteBtns = wrapper.findAllComponents({ name: "VBtn" }).filter((b) =>
      b.text().trim() === "Delete"
    );
    const confirmDeleteBtn = deleteBtns[deleteBtns.length - 1];
    await confirmDeleteBtn.trigger("click");
    await flushPromises();

    expect(todoServices.deleteTodo).toHaveBeenCalledWith(10);
    expect(document.body.textContent).not.toContain("Buy milk");
  });
});
