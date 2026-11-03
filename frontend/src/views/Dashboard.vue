<script setup>
import { ref, onMounted } from "vue";
import listServices from "../services/listServices.js";

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

const listNameRules = [
  (v) => (typeof v === "string" && v.trim().length > 0) || "List name is required.",
  (v) => !v || v.trim().length <= 100 || "List name must be 100 characters or fewer.",
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
    deleteDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to delete list.";
  } finally {
    deleteSubmitting.value = false;
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
  </v-container>
</template>
