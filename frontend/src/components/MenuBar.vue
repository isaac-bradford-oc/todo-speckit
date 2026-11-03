<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";

const user = ref(Utils.getStore("user"));

const displayName = computed(() => {
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

async function logout() {
  await authServices.logoutUser();
}
</script>

<template>
  <v-app-bar color="primary" density="compact" flat>
    <v-app-bar-title class="font-weight-bold">Todo Speckit</v-app-bar-title>
    <v-spacer />
    <span v-if="displayName" class="mr-4 text-body-2">{{ displayName }}</span>
    <v-btn
      variant="text"
      color="on-primary"
      class="text-none"
      @click="logout"
    >
      Sign out
    </v-btn>
  </v-app-bar>
</template>
