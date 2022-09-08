<script lang="ts" setup>
import { VButton } from "@halo-dev/components";
import CommentItem from "./CommentItem.vue";

defineProps({
  msg: {
    type: String,
    default: "World",
  },
});

const comments = [
  {
    author: {
      name: "Ryan Wang",
      avatar: "https://ryanc.cc/avatar",
    },
    content:
      "红烛秋光冷画屏，轻罗小扇扑流萤。天阶夜色凉如水，坐看牵牛织女星。 -- 唐·杜牧",
  },
  {
    author: {
      name: "张泌",
    },
    content:
      "碧栏干外小中庭，雨初晴，晓莺声。飞絮落花，时节近清明。睡起卷帘无一事，匀面了，没心情。 -- 江城子·碧栏干外小中庭",
  },

  {
    author: {
      name: "毛文锡",
    },
    content:
      "鸳鸯对浴银塘暖，水面蒲稍短。垂杨低拂麴尘波，蛛丝结网露珠多，滴圆荷。遥思桃叶吴江碧，便是天河隔。锦鳞红鬣影沉沉，相思空有梦相寻，意难任。",
  },
];
</script>
<template>
  <div class="halo-comment-widget">
    <div class="comment-form flex gap-4">
      <div class="flex-1 flex flex-col gap-y-4">
        <div v-if="false" class="grid gap-2 grid-cols-1 sm:grid-cols-3">
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
          class="w-full h-28 rounded-base border-gray-300 shadow-sm focus:border-secondary ring-0 outline-0"
          placeholder="Write a comment..."
        ></textarea>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img
              class="rounded-full w-8 h-8"
              :src="`https://avatars.dicebear.com/api/adventurer-neutral/ryanwang.svg`"
            />
            <span class="text-sm font-medium"> Ryan Wang </span>
            <VButton size="sm">注销</VButton>
          </div>
          <VButton type="secondary">提交评论</VButton>
        </div>
      </div>
    </div>
    <div class="comment-timeline mt-6">
      <div class="flex items-center">
        <div class="flex flex-auto gap-1 items-center">
          <span class="text-sm font-medium text-gray-900">10 条评论</span>
          <span class="font-bold">·</span>
          <span class="text-sm text-gray-800">20 条回复</span>
        </div>
        <div></div>
      </div>

      <div class="flex flex-col mt-4 divide-y divide-gray-100">
        <CommentItem
          v-for="(comment, index) in comments"
          :key="index"
          :comment="comment"
        ></CommentItem>
      </div>
    </div>
  </div>
</template>
