<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";
import userServices from "../services/userServices.js";
import { emailRules } from "../config/validation.js";

const user = ref(Utils.getStore("user"));
const profileMenu = ref(false);

// Edit Profile Dialog State
const editDialog = ref(false);
const editForm = ref(null);
const editLoading = ref(false);
const editError = ref("");

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const fullName = computed(() => {
  if (!user.value) return "";
  const name = [user.value.fName, user.value.lName].filter(Boolean).join(" ");
  return name || user.value.username || "";
});

function handleUserUpdate() {
  user.value = Utils.getStore("user");
}

onMounted(() => {
  window.addEventListener("user-logged-in", handleUserUpdate);
  window.addEventListener("user-logged-out", handleUserUpdate);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", handleUserUpdate);
  window.removeEventListener("user-logged-out", handleUserUpdate);
});

function openEditProfile() {
  profileMenu.value = false;
  editError.value = "";
  if (user.value) {
    fName.value = user.value.fName || "";
    lName.value = user.value.lName || "";
    email.value = user.value.email || "";
    username.value = user.value.username || "";
  }
  password.value = "";
  confirmPassword.value = "";
  editDialog.value = true;
}

function cancelEditProfile() {
  editDialog.value = false;
  editError.value = "";
}

const requiredRule = (field) => (v) =>
  (typeof v === "string" && v.trim().length > 0) || `${field} is required.`;

const passwordRules = [
  (v) => !v || v.length >= 8 || "Password must be at least 8 characters.",
];

const confirmPasswordRules = [
  (v) => !password.value || v === password.value || "Passwords do not match.",
];

async function handleSaveProfile() {
  if (editForm.value) {
    const { valid } = await editForm.value.validate();
    if (!valid) {
      if (!fName.value.trim()) editError.value = "First name is required.";
      else if (!lName.value.trim()) editError.value = "Last name is required.";
      else if (!email.value.trim()) editError.value = "Email is required.";
      else if (!username.value.trim()) editError.value = "Username is required.";
      else if (password.value && password.value.length < 8)
        editError.value = "Password must be at least 8 characters.";
      else if (password.value && password.value !== confirmPassword.value)
        editError.value = "Passwords do not match.";
      else editError.value = "Enter a valid email address.";
      return;
    }
  }

  // Double check manual validation
  if (password.value && password.value !== confirmPassword.value) {
    editError.value = "Passwords do not match.";
    return;
  }
  if (password.value && password.value.length < 8) {
    editError.value = "Password must be at least 8 characters.";
    return;
  }

  editLoading.value = true;
  editError.value = "";

  const payload = {
    fName: fName.value.trim(),
    lName: lName.value.trim(),
    email: email.value.trim(),
    username: username.value.trim(),
  };

  if (password.value) {
    payload.password = password.value;
  }

  const userId = user.value?.userId || user.value?.id;

  try {
    const response = await userServices.updateUser(userId, payload);
    const updatedUser = {
      ...user.value,
      ...response.data,
      userId: response.data.id || user.value.userId,
    };
    Utils.setStore("user", updatedUser);
    user.value = updatedUser;
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    editDialog.value = false;
  } catch (error) {
    editError.value = error.response?.data?.message || "Failed to update profile.";
  } finally {
    editLoading.value = false;
  }
}

async function logout() {
  profileMenu.value = false;
  await authServices.logoutUser();
}
</script>

<template>
  <v-app-bar color="primary" density="compact" flat>
    <v-app-bar-title class="font-weight-bold">Todo Speckit</v-app-bar-title>
    <v-spacer />

    <!-- Profile Dropdown (Feature 4) -->
    <v-menu v-model="profileMenu" :close-on-content-click="false" location="bottom end">
      <template #activator="{ props }">
        <v-btn
          icon="mdi-account-circle"
          variant="text"
          color="on-primary"
          aria-label="User profile"
          v-bind="props"
        />
      </template>

      <v-card min-width="260px" class="pa-2">
        <v-list lines="two">
          <v-list-item class="px-2">
            <v-list-item-title class="font-weight-bold text-subtitle-1">
              {{ fullName }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              <div>@{{ user?.username }}</div>
              <div>{{ user?.email }}</div>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-divider class="my-2" />

        <div class="px-2 pb-2">
          <v-btn
            color="primary"
            variant="tonal"
            block
            class="oc-cta mb-2"
            @click="openEditProfile"
          >
            Edit Profile
          </v-btn>
          <v-btn
            variant="text"
            color="error"
            block
            class="text-none justify-start px-2"
            prepend-icon="mdi-logout"
            @click="logout"
          >
            Log out
          </v-btn>
        </div>
      </v-card>
    </v-menu>

    <!-- Edit Profile Dialog (Feature 4) -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card class="pa-4">
        <v-card-title class="text-h6 font-weight-bold">Edit Profile</v-card-title>
        <v-card-text>
          <v-alert v-if="editError" type="error" class="mb-4" density="compact">
            {{ editError }}
          </v-alert>

          <v-form ref="editForm" @submit.prevent="handleSaveProfile">
            <v-text-field
              v-model="fName"
              label="First name"
              :rules="[requiredRule('First name')]"
              required
            />
            <v-text-field
              v-model="lName"
              label="Last name"
              :rules="[requiredRule('Last name')]"
              required
            />
            <v-text-field
              v-model="email"
              label="Email"
              :rules="emailRules"
              type="email"
              required
            />
            <v-text-field
              v-model="username"
              label="Username"
              :rules="[requiredRule('Username')]"
              required
            />
            <v-text-field
              v-model="password"
              label="New password (optional)"
              type="password"
              :rules="passwordRules"
            />
            <v-text-field
              v-model="confirmPassword"
              label="Confirm new password"
              type="password"
              :rules="confirmPasswordRules"
            />
          </v-form>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="cancelEditProfile">Cancel</v-btn>
          <v-btn
            color="primary"
            class="oc-cta"
            :loading="editLoading"
            @click="handleSaveProfile"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app-bar>
</template>
