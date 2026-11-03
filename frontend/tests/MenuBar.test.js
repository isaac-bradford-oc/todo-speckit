import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import authServices from "../src/services/authServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
  },
}));

describe("Feature 2 — MenuBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders display name and signs out", async () => {
    Utils.setStore("user", {
      fName: "Jane",
      lName: "Doe",
      username: "jdoe",
    });

    const TestComponent = {
      components: { MenuBar },
      template: "<v-layout><MenuBar /></v-layout>",
    };

    const { wrapper } = await mountWithPlugins(TestComponent);
    await flushPromises();

    expect(wrapper.text()).toContain("Jane Doe");

    const signOutBtn = wrapper.findAllComponents({ name: "VBtn" }).find((b) =>
      b.text().includes("Sign out")
    );
    expect(signOutBtn.exists()).toBe(true);

    await signOutBtn.trigger("click");
    await flushPromises();

    expect(authServices.logoutUser).toHaveBeenCalled();
  });
});
