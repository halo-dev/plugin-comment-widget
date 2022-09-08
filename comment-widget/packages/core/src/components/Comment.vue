<script lang="ts" setup>
import { VButton, VTag } from "@halo-dev/components";

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
        <img class="rounded-full w-14 h-14" src="https://ryanc.cc/avatar" />
        <VButton size="sm">登录</VButton>
      </div>
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

        <div class="flex justify-end">
          <VButton type="secondary">提交评论</VButton>
        </div>
      </div>
    </div>
    <div class="comment-timeline mt-4">
      <div class="flex items-center">
        <div class="flex flex-auto gap-1 items-center">
          <span class="text-sm font-medium text-gray-900">10 条评论</span>
          <span class="font-bold">·</span>
          <span class="text-sm text-gray-800">20 条回复</span>
        </div>
        <div></div>
      </div>

      <div class="flex flex-col mt-6 divide-y divide-gray-100">
        <div class="comment-timeline-item py-4" v-for="i in 10" :key="i">
          <div class="flex flex-row gap-3">
            <div class="comment-avatar w-9 h-9">
              <img
                class="w-full h-full rounded-full"
                src="https://ryanc.cc/avatar"
              />
            </div>
            <div class="flex-1">
              <div class="comment-informations flex items-center">
                <div class="flex flex-auto items-center gap-3">
                  <div class="text-sm font-medium">Ryan Wang</div>
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
                  目前是不行的，建议只用 Vue
                  做交互相关的组件，因为数据交互还是通过我们提供的模板引擎方法。所以你可能还是需要熟悉
                  Thymeleaf 语法以及我们提供的主题 API。当然，我们也提供了 HTTP
                  API，你也可以用 API 进行数据交互。
                </p>
              </div>
              <div
                class="comment-actions mt-2 flex flex-auto gap-1 items-center"
              >
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
                  <div
                    class="comment-timeline-item py-3"
                    v-for="i in 10"
                    :class="{ '!pt-2': i === 1 }"
                    :key="i"
                  >
                    <div class="flex flex-row gap-3">
                      <div class="comment-avatar w-9 h-9">
                        <img
                          class="w-full h-full rounded-full"
                          src="https://ryanc.cc/avatar"
                        />
                      </div>
                      <div class="flex-1">
                        <div class="comment-informations flex items-center">
                          <div class="flex flex-auto items-center gap-3">
                            <div class="text-sm font-medium">Ryan Wang</div>
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
                            目前是不行的，建议只用 Vue
                            做交互相关的组件，因为数据交互还是通过我们提供的模板引擎方法。所以你可能还是需要熟悉
                            Thymeleaf 语法以及我们提供的主题
                            API。当然，我们也提供了 HTTP API，你也可以用 API
                            进行数据交互。
                          </p>
                        </div>
                        <div
                          class="comment-actions mt-2 flex flex-auto gap-1 items-center"
                        >
                          <span
                            class="text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
                          >
                            回复
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
