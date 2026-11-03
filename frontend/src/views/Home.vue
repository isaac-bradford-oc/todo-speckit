<script setup>
import { computed } from "vue";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";

const user = computed(() => Utils.getStore("user"));
const firstName = computed(() => user.value?.fName || "User");

const handleSignOut = async () => {
  await authServices.logoutUser();
};
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-4">Welcome, {{ firstName }}!</h1>
    <p class="text-body-1 mb-6">
      You are signed in. Your private dashboard will be available here.
    </p>
    <v-btn color="primary" variant="elevated" @click="handleSignOut">
      Sign out
    </v-btn>
  </v-container>
</template>
