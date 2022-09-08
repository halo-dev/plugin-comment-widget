<script lang="ts" setup>
import ReplyItem from "./ReplyItem.vue";
import { VTag } from "@halo-dev/components";

defineProps<{
  comment: object;
}>();

const replies = [
  {
    author: {
      name: "李白",
      avatar: "",
    },
    content: "好诗好诗！",
  },
  {
    author: {
      name: "辛弃疾",
      avatar: "",
    },
    content: "确实好！",
    ref: {
      name: "李白",
    },
  },
  {
    author: {
      name: "李白",
      avatar: "",
    },
    content: "来一首？",
    ref: {
      name: "辛弃疾",
    },
  },
];
</script>

<template>
  <div class="comment-item py-4">
    <div class="flex flex-row gap-3">
      <div class="comment-avatar w-9 h-9">
        <img
          class="w-full h-full rounded-full"
          :src="`https://avatars.dicebear.com/api/adventurer-neutral/${comment.author.name}.svg`"
        />
      </div>
      <div class="flex-1">
        <div class="comment-informations flex items-center">
          <div class="flex flex-auto items-center gap-3">
            <div class="text-sm font-medium">{{ comment.author.name }}</div>
            <div
              class="text-xs text-gray-500 cursor-pointer hover:text-blue-600 hover:underline"
            >
              2 hours ago
            </div>
            <VTag rounded>Author</VTag>
          </div>
        </div>
        <div class="comment-content mt-2">
          <p class="text-sm text-gray-800">
            {{ comment.content }}
          </p>
        </div>
        <div class="comment-actions mt-2 flex flex-auto gap-1 items-center">
          <span
            class="text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            10 条回复
          </span>
          <span class="text-gray-600">·</span>
          <span
            class="text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            新回复
          </span>
        </div>
        <div class="comment-replies mt-2">
          <div class="flex flex-col divide-y divide-gray-100">
            <ReplyItem
              v-for="(reply, index) in replies"
              :class="{ '!pt-2': index === 1 }"
              :reply="reply"
              :key="index"
            ></ReplyItem>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
