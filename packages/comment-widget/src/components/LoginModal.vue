<script lang="ts" setup>
import { VModal, VButton } from "@halo-dev/components";
import { ref, watch } from "vue";
import { v4 as uuid } from "uuid";
import qs from "qs";
import axios from "axios";

const props = withDefaults(
  defineProps<{
    visible: boolean;
  }>(),
  {
    visible: false,
  }
);

const emit = defineEmits<{
  (event: "update:visible", visible: boolean): void;
  (event: "close"): void;
}>();

const formState = ref<{ _csrf: string; username: string; password: string }>({
  _csrf: "",
  username: "",
  password: "",
});

const loading = ref(false);

const onVisibleChange = (visible: boolean) => {
  emit("update:visible", visible);
  if (!visible) {
    emit("close");
  }
};

const handleGenerateToken = async () => {
  const token = uuid();
  formState.value._csrf = token;
  document.cookie = `XSRF-TOKEN=${token}; Path=/;`;
};

const handleLogin = async () => {
  try {
    loading.value = true;

    await axios.post(
      `${import.meta.env.VITE_API_URL}/login`,
      qs.stringify(formState.value),
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    window.location.reload();
  } catch (e) {
    console.error("Failed to login", e);
    alert("登录失败，用户名或密码错误");
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      handleGenerateToken();
    }
  }
);
</script>

<template>
  <VModal
    title="登录"
    :visible="visible"
    :width="400"
    @update:visible="onVisibleChange"
  >
    <div class="flex flex-col gap-2">
      <input
        v-model="formState.username"
        class="rounded-base block h-9 w-full resize-none appearance-none border border-gray-300 bg-white px-3 text-sm text-black antialiased outline-0 transition-all"
        placeholder="用户名"
        type="text"
      />
      <input
        v-model="formState.password"
        class="rounded-base block h-9 w-full resize-none appearance-none border border-gray-300 bg-white px-3 text-sm text-black antialiased outline-0 transition-all"
        placeholder="密码"
        type="password"
      />
    </div>
    <template #footer>
      <VButton :loading="loading" type="default" @click="handleLogin">
        登录
      </VButton>
    </template>
  </VModal>
</template>
