<script setup>
import { ref, onMounted } from "vue";
import listServices from "../services/listServices.js";
import todoServices from "../services/todoServices.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

// Add List Dialog State
const addDialog = ref(false);
const newListName = ref("");
const addForm = ref(null);
const addError = ref("");
const addSubmitting = ref(false);

// Edit List Dialog State
const editDialog = ref(false);
const editingList = ref(null);
const editListName = ref("");
const editForm = ref(null);
const editError = ref("");
const editSubmitting = ref(false);

// Delete List Dialog State
const deleteDialog = ref(false);
const deletingList = ref(null);
const deleteSubmitting = ref(false);

// Items Dialog State (Feature 3)
const itemsDialog = ref(false);
const activeList = ref(null);
const todos = ref([]);
const todosLoading = ref(false);
const todosError = ref("");

// Add Todo Dialog State
const addTodoDialog = ref(false);
const newTodoTitle = ref("");
const addTodoForm = ref(null);
const addTodoError = ref("");
const addTodoSubmitting = ref(false);

// Edit Todo Dialog State
const editTodoDialog = ref(false);
const editingTodo = ref(null);
const editTodoTitle = ref("");
const editTodoForm = ref(null);
const editTodoError = ref("");
const editTodoSubmitting = ref(false);

// Delete Todo Dialog State
const deleteTodoDialog = ref(false);
const deletingTodo = ref(null);
const deleteTodoSubmitting = ref(false);

const listNameRules = [
  (v) => (typeof v === "string" && v.trim().length > 0) || "List name is required.",
  (v) => !v || v.trim().length <= 100 || "List name must be 100 characters or fewer.",
];

const todoTitleRules = [
  (v) => (typeof v === "string" && v.trim().length > 0) || "Todo title is required.",
  (v) => !v || v.trim().length <= 255 || "Todo title must be 255 characters or fewer.",
];

async function fetchLists() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await listServices.getLists();
    lists.value = response.data;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to load lists.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchLists();
});

// List CRUD Handlers
function openAddDialog() {
  newListName.value = "";
  addError.value = "";
  addDialog.value = true;
}

async function handleCreateList() {
  if (addForm.value) {
    const { valid } = await addForm.value.validate();
    if (!valid) {
      addError.value = "List name is required.";
      return;
    }
  } else if (!newListName.value || !newListName.value.trim()) {
    addError.value = "List name is required.";
    return;
  }

  addSubmitting.value = true;
  addError.value = "";
  try {
    const response = await listServices.createList({ name: newListName.value.trim() });
    lists.value.push(response.data);
    lists.value.sort((a, b) => a.name.localeCompare(b.name));
    addDialog.value = false;
    newListName.value = "";
  } catch (error) {
    addError.value = error.response?.data?.message || "Failed to create list.";
  } finally {
    addSubmitting.value = false;
  }
}

function openEditDialog(list) {
  editingList.value = list;
  editListName.value = list.name;
  editError.value = "";
  editDialog.value = true;
}

async function handleUpdateList() {
  if (editForm.value) {
    const { valid } = await editForm.value.validate();
    if (!valid) {
      editError.value = "List name is required.";
      return;
    }
  } else if (!editListName.value || !editListName.value.trim()) {
    editError.value = "List name is required.";
    return;
  }

  editSubmitting.value = true;
  editError.value = "";
  try {
    const response = await listServices.updateList(editingList.value.id, {
      name: editListName.value.trim(),
    });
    const index = lists.value.findIndex((l) => l.id === editingList.value.id);
    if (index !== -1) {
      lists.value[index] = response.data;
      lists.value.sort((a, b) => a.name.localeCompare(b.name));
    }
    editDialog.value = false;
  } catch (error) {
    editError.value = error.response?.data?.message || "Failed to update list.";
  } finally {
    editSubmitting.value = false;
  }
}

function openDeleteDialog(list) {
  deletingList.value = list;
  deleteDialog.value = true;
}

async function handleDeleteList() {
  if (!deletingList.value) return;

  deleteSubmitting.value = true;
  try {
    await listServices.deleteList(deletingList.value.id);
    lists.value = lists.value.filter((l) => l.id !== deletingList.value.id);
    if (activeList.value?.id === deletingList.value.id) {
      itemsDialog.value = false;
    }
    deleteDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to delete list.";
  } finally {
    deleteSubmitting.value = false;
  }
}

// Items Management Handlers (Feature 3)
async function openItemsDialog(list) {
  activeList.value = list;
  todos.value = [];
  todosError.value = "";
  itemsDialog.value = true;
  todosLoading.value = true;

  try {
    const response = await todoServices.getTodos(list.id);
    todos.value = response.data;
  } catch (error) {
    todosError.value = error.response?.data?.message || "Failed to load todos.";
  } finally {
    todosLoading.value = false;
  }
}

function openAddTodoDialog() {
  newTodoTitle.value = "";
  addTodoError.value = "";
  addTodoDialog.value = true;
}

async function handleCreateTodo() {
  if (addTodoForm.value) {
    const { valid } = await addTodoForm.value.validate();
    if (!valid) {
      addTodoError.value = "Todo title is required.";
      return;
    }
  } else if (!newTodoTitle.value || !newTodoTitle.value.trim()) {
    addTodoError.value = "Todo title is required.";
    return;
  }

  addTodoSubmitting.value = true;
  addTodoError.value = "";
  try {
    const response = await todoServices.createTodo(activeList.value.id, {
      title: newTodoTitle.value.trim(),
    });
    todos.value.push(response.data);
    addTodoDialog.value = false;
    newTodoTitle.value = "";
  } catch (error) {
    addTodoError.value = error.response?.data?.message || "Failed to create todo.";
  } finally {
    addTodoSubmitting.value = false;
  }
}

async function handleToggleComplete(todo) {
  const updatedStatus = !todo.completed;
  try {
    const response = await todoServices.updateTodo(todo.id, { completed: updatedStatus });
    const index = todos.value.findIndex((t) => t.id === todo.id);
    if (index !== -1) {
      todos.value[index] = response.data;
    }
  } catch (error) {
    todosError.value = error.response?.data?.message || "Failed to update todo.";
  }
}

function openEditTodoDialog(todo) {
  editingTodo.value = todo;
  editTodoTitle.value = todo.title;
  editTodoError.value = "";
  editTodoDialog.value = true;
}

async function handleUpdateTodo() {
  if (editTodoForm.value) {
    const { valid } = await editTodoForm.value.validate();
    if (!valid) {
      editTodoError.value = "Todo title is required.";
      return;
    }
  } else if (!editTodoTitle.value || !editTodoTitle.value.trim()) {
    editTodoError.value = "Todo title is required.";
    return;
  }

  editTodoSubmitting.value = true;
  editTodoError.value = "";
  try {
    const response = await todoServices.updateTodo(editingTodo.value.id, {
      title: editTodoTitle.value.trim(),
    });
    const index = todos.value.findIndex((t) => t.id === editingTodo.value.id);
    if (index !== -1) {
      todos.value[index] = response.data;
    }
    editTodoDialog.value = false;
  } catch (error) {
    editTodoError.value = error.response?.data?.message || "Failed to update todo.";
  } finally {
    editTodoSubmitting.value = false;
  }
}

function openDeleteTodoDialog(todo) {
  deletingTodo.value = todo;
  deleteTodoDialog.value = true;
}

async function handleDeleteTodo() {
  if (!deletingTodo.value) return;

  deleteTodoSubmitting.value = true;
  try {
    await todoServices.deleteTodo(deletingTodo.value.id);
    todos.value = todos.value.filter((t) => t.id !== deletingTodo.value.id);
    deleteTodoDialog.value = false;
    deletingTodo.value = null;
  } catch (error) {
    todosError.value = error.response?.data?.message || "Failed to delete todo.";
  } finally {
    deleteTodoSubmitting.value = false;
  }
}
</script>

<template>
  <v-container class="py-8" style="max-width: 900px">
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4 font-weight-bold">My Lists</h1>
      <v-btn
        color="primary"
        class="oc-cta"
        prepend-icon="mdi-plus"
        @click="openAddDialog"
      >
        + New List
      </v-btn>
    </div>

    <v-alert
      v-if="errorMessage"
      type="error"
      class="mb-4"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else-if="lists.length === 0" class="text-center py-12 text-medium-emphasis">
      <p class="text-body-1">No lists yet. Create your first list.</p>
    </div>

    <v-card v-else variant="outlined">
      <v-list lines="one">
        <template v-for="(list, idx) in lists" :key="list.id">
          <v-list-item class="py-2">
            <v-list-item-title class="text-body-1 font-weight-medium">
              {{ list.name }}
            </v-list-item-title>

            <template #append>
              <v-btn
                icon="mdi-format-list-checks"
                size="small"
                variant="text"
                color="primary"
                aria-label="Items"
                class="mr-1"
                @click="openItemsDialog(list)"
              />
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                aria-label="Edit list"
                class="mr-1"
                @click="openEditDialog(list)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                aria-label="Delete list"
                @click="openDeleteDialog(list)"
              />
            </template>
          </v-list-item>
          <v-divider v-if="idx < lists.length - 1" />
        </template>
      </v-list>
    </v-card>

    <!-- Create List Dialog -->
    <v-dialog v-model="addDialog" max-width="500px">
      <v-card class="pa-4">
        <v-card-title class="text-h6 font-weight-bold">Create New List</v-card-title>
        <v-card-text>
          <v-alert v-if="addError" type="error" class="mb-4" density="compact">
            {{ addError }}
          </v-alert>
          <v-form ref="addForm" @submit.prevent="handleCreateList">
            <v-text-field
              v-model="newListName"
              label="List name"
              :rules="listNameRules"
              required
              autofocus
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="addDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            class="oc-cta"
            :loading="addSubmitting"
            @click="handleCreateList"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit List Dialog -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card class="pa-4">
        <v-card-title class="text-h6 font-weight-bold">Rename List</v-card-title>
        <v-card-text>
          <v-alert v-if="editError" type="error" class="mb-4" density="compact">
            {{ editError }}
          </v-alert>
          <v-form ref="editForm" @submit.prevent="handleUpdateList">
            <v-text-field
              v-model="editListName"
              label="List name"
              :rules="listNameRules"
              required
              autofocus
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            class="oc-cta"
            :loading="editSubmitting"
            @click="handleUpdateList"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="450px">
      <v-card class="pa-4">
        <v-card-title class="text-h6 font-weight-bold">Delete List</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deletingList?.name }}"?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="deleteSubmitting"
            @click="handleDeleteList"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- List Items Dialog (Feature 3) -->
    <v-dialog v-model="itemsDialog" max-width="650px">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <v-card-title class="text-h6 font-weight-bold pa-0">
            {{ activeList?.name }} — Items
          </v-card-title>
          <v-btn
            color="primary"
            class="oc-cta"
            prepend-icon="mdi-plus"
            @click="openAddTodoDialog"
          >
            + Add Item
          </v-btn>
        </div>

        <v-card-text class="pa-0">
          <v-alert v-if="todosError" type="error" class="mb-4" density="compact">
            {{ todosError }}
          </v-alert>

          <div v-if="todosLoading" class="text-center py-6">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <div v-else-if="todos.length === 0" class="text-center py-8 text-medium-emphasis">
            <p class="text-body-1">No todos in this list yet.</p>
          </div>

          <v-list v-else lines="one" class="pa-0">
            <template v-for="(todo, idx) in todos" :key="todo.id">
              <v-list-item class="px-0 py-1">
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="todo.completed"
                    color="primary"
                    @update:model-value="handleToggleComplete(todo)"
                  />
                </template>

                <v-list-item-title
                  :class="[
                    'text-body-1',
                    todo.completed ? 'text-decoration-line-through text-medium-emphasis' : '',
                  ]"
                >
                  {{ todo.title }}
                </v-list-item-title>

                <template #append>
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    aria-label="Edit item"
                    class="mr-1"
                    @click="openEditTodoDialog(todo)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    aria-label="Delete item"
                    @click="openDeleteTodoDialog(todo)"
                  />
                </template>
              </v-list-item>
              <v-divider v-if="idx < todos.length - 1" />
            </template>
          </v-list>
        </v-card-text>

        <v-card-actions class="justify-end mt-4">
          <v-btn variant="text" @click="itemsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Todo Dialog (Feature 3) -->
    <v-dialog v-model="addTodoDialog" max-width="500px">
      <v-card class="pa-4">
        <v-card-title class="text-h6 font-weight-bold">Add Item</v-card-title>
        <v-card-text>
          <v-alert v-if="addTodoError" type="error" class="mb-4" density="compact">
            {{ addTodoError }}
          </v-alert>
          <v-form ref="addTodoForm" @submit.prevent="handleCreateTodo">
            <v-text-field
              v-model="newTodoTitle"
              label="Todo title"
              :rules="todoTitleRules"
              required
              autofocus
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="addTodoDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            class="oc-cta"
            :loading="addTodoSubmitting"
            @click="handleCreateTodo"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Todo Dialog (Feature 3) -->
    <v-dialog v-model="editTodoDialog" max-width="500px">
      <v-card class="pa-4">
        <v-card-title class="text-h6 font-weight-bold">Edit Item</v-card-title>
        <v-card-text>
          <v-alert v-if="editTodoError" type="error" class="mb-4" density="compact">
            {{ editTodoError }}
          </v-alert>
          <v-form ref="editTodoForm" @submit.prevent="handleUpdateTodo">
            <v-text-field
              v-model="editTodoTitle"
              label="Todo title"
              :rules="todoTitleRules"
              required
              autofocus
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="editTodoDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            class="oc-cta"
            :loading="editTodoSubmitting"
            @click="handleUpdateTodo"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Todo Confirmation Dialog (Feature 3) -->
    <v-dialog v-model="deleteTodoDialog" max-width="450px">
      <v-card class="pa-4">
        <v-card-title class="text-h6 font-weight-bold">Delete Item</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deletingTodo?.title }}"?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="deleteTodoDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="deleteTodoSubmitting"
            @click="handleDeleteTodo"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
