<script lang="ts" setup>
import { VButton } from "@halo-dev/components";

defineProps({
  msg: {
    type: String,
    default: "World",
  },
});
</script>
<template>
  <div class="halo-comment-widget">
    <div class="comment-form flex gap-4">
      <div class="flex flex-col gap-4">
        <img class="rounded-full w-16 h-16" src="https://ryanc.cc/avatar" />
        <VButton>登录</VButton>
      </div>
      <div class="flex-1 flex flex-col gap-y-4">
        <div class="grid gap-2 grid-cols-1 sm:grid-cols-3">
          <input
            class="w-full rounded-base border-gray-300 shadow-sm focus:border-secondary ring-0 outline-0"
            type="text"
          />
          <input
            class="w-full rounded-base border-gray-300 shadow-sm focus:border-secondary ring-0 outline-0"
            type="text"
          />
          <input
            class="w-full rounded-base border-gray-300 shadow-sm focus:border-secondary ring-0 outline-0"
            type="text"
          />
        </div>
        <textarea
          class="w-full h-24 rounded-base border-gray-300 shadow-sm focus:border-secondary ring-0 outline-0"
          placeholder="Write a comment..."
        ></textarea>
      </div>
    </div>
    <div class="comment-group"></div>
  </div>
</template>
