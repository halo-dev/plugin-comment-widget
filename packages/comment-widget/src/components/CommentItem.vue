<script lang="ts" setup>
import ReplyItem from "./ReplyItem.vue";
import {
  VTag,
  VAvatar,
  VEmpty,
  VSpace,
  VButton,
  VLoading,
} from "@halo-dev/components";
import Form from "./Form.vue";
import type { CommentVo, ReplyVo } from "@halo-dev/api-client";
import { computed, provide, ref, watch, type Ref } from "vue";
import { apiClient } from "@/utils/api-client";
import { useTimeAgo } from "@vueuse/core";

const props = withDefaults(
  defineProps<{
    comment?: CommentVo;
  }>(),
  {
    comment: undefined,
  }
);

const showReplies = ref(false);
const showForm = ref(false);

const replies = ref<ReplyVo[]>([] as ReplyVo[]);
const loading = ref(false);
const hoveredReply = ref<ReplyVo>();

provide<Ref<ReplyVo | undefined>>("hoveredReply", hoveredReply);

const timeAgo = useTimeAgo(
  new Date(props.comment?.spec.approvedTime || new Date())
);

const isAuthor = computed(() => {
  if (!props.comment) {
    return false;
  }
  return false;
  // TODO get post info
  // const { comment, subject, owner } = props.comment;
  // if (comment.spec.owner.kind !== "User") {
  //   return false;
  // }
  // if (!subject) {
  //   return false;
  // }
  // const { spec } = subject as Post;
  // return owner?.name === spec.owner;
});

const website = computed(() => {
  if (!props.comment) {
    return "";
  }
  const { annotations } = props.comment.spec.owner;
  return annotations?.website;
});

const handleFetchReplies = async () => {
  try {
    loading.value = true;
    const { data } = await apiClient.comment.listCommentReplies({
      name: props.comment?.metadata.name as string,
    });
    replies.value = data.items;
  } catch (error) {
    console.error("Failed to fetch comment replies", error);
  } finally {
    loading.value = false;
  }
};

watch(
  () => showReplies.value,
  () => {
    if (showReplies.value) {
      handleFetchReplies();
    } else {
      replies.value.length = 0;
    }
  }
);

const onReplyCreated = () => {
  showForm.value = false;
  showReplies.value = true;
  handleFetchReplies();
};
</script>

<template>
  <div :id="`comment-${comment?.metadata.name}`" class="comment-item py-4">
    <div class="flex flex-row gap-3">
      <div class="comment-avatar">
        <VAvatar
          :src="comment?.owner?.avatar"
          :alt="comment?.owner?.displayName"
          size="sm"
          circle
        />
      </div>
      <div class="flex-1">
        <div class="comment-informations flex items-center">
          <div class="flex flex-auto items-center gap-3">
            <div class="text-sm font-medium dark:text-slate-50">
              <a
                v-if="website"
                class="hover:text-gray-600 dark:hover:text-slate-300"
                :href="website"
                target="_blank"
              >
                {{ comment?.owner.displayName }}
              </a>
              <span v-else>
                {{ comment?.owner.displayName }}
              </span>
            </div>
            <a
              :href="`#comment-${comment?.metadata.name}`"
              class="cursor-pointer text-xs text-gray-500 hover:text-blue-600 hover:underline dark:text-slate-400 dark:hover:text-slate-300"
            >
              {{ timeAgo }}
            </a>
            <VTag
              v-if="isAuthor"
              rounded
              class="dark:!border-slate-600 dark:!bg-slate-700 dark:!text-slate-50"
            >
              Author
            </VTag>
          </div>
        </div>
        <div class="comment-content mt-2">
          <p class="text-sm text-gray-800 dark:text-slate-200">
            {{ comment?.spec.content }}
          </p>
        </div>
        <div class="comment-actions mt-2 flex flex-auto items-center gap-1">
          <span
            class="cursor-pointer select-none text-xs text-gray-600 hover:text-gray-900 dark:text-slate-500 dark:hover:text-slate-400"
            @click="showReplies = !showReplies"
          >
            {{ comment?.status?.replyCount || 0 }} 条回复
          </span>
          <span class="text-gray-600">·</span>
          <span
            class="cursor-pointer select-none text-xs text-gray-600 hover:text-gray-900 dark:text-slate-500 dark:hover:text-slate-400"
            @click="showForm = !showForm"
          >
            加入回复
          </span>
        </div>

        <Form
          v-if="showForm"
          class="mt-2"
          :comment="comment"
          @created="onReplyCreated"
        />

        <div v-if="showReplies" class="comment-replies mt-2">
          <div
            class="flex flex-col divide-y divide-gray-100 dark:divide-slate-700"
          >
            <VLoading v-if="loading" class="dark:text-slate-100" />
            <Transition
              v-else-if="!replies.length && !showForm"
              appear
              name="fade"
            >
              <VEmpty
                title="暂无回复"
                message="你可以尝试点击刷新或者添加新回复"
              >
                <template #actions>
                  <VSpace>
                    <VButton type="default" @click="handleFetchReplies">
                      刷新
                    </VButton>
                    <VButton type="primary" @click="showForm = true">
                      回复
                    </VButton>
                  </VSpace>
                </template>
              </VEmpty>
            </Transition>
            <TransitionGroup v-else appear name="fade" tag="div">
              <ReplyItem
                v-for="(reply, index) in replies"
                :key="index"
                :class="{ '!pt-2': index === 1 }"
                :comment="comment"
                :reply="reply"
                :replies="replies"
                @reload="handleFetchReplies"
              ></ReplyItem>
            </TransitionGroup>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
