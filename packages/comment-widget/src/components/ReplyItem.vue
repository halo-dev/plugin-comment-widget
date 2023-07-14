<script lang="ts" setup>
import { VTag, VAvatar } from "@halo-dev/components";
import Form from "./Form.vue";
import type { CommentVo, ReplyVo } from "@halo-dev/api-client";
import { computed, inject, ref, type Ref } from "vue";
import { formatDatetime, timeAgo } from "@/utils/date";
import MdiReply from "~icons/mdi/reply";
import { apiClient } from "@/utils/api-client";
import MdiCardsHeart from "~icons/mdi/cards-heart";
import MdiCardsHeartOutline from "~icons/mdi/cards-heart-outline";

const props = defineProps<{
  comment?: CommentVo;
  reply: ReplyVo;
  replies: ReplyVo[];
}>();

const emit = defineEmits<{
  (event: "reload"): void;
}>();

const showForm = ref(false);

const website = computed(() => {
  if (!props.reply) {
    return "";
  }
  const { annotations } = props.reply.spec.owner;
  return annotations?.website;
});

const quoteReply = computed(() => {
  const { quoteReply: replyName } = props.reply.spec;

  if (!replyName) {
    return undefined;
  }

  return props.replies.find((reply) => reply.metadata.name === replyName);
});

const onReplyCreated = () => {
  emit("reload");
  showForm.value = false;
};

// Show hovered reply
const hoveredReply = inject<Ref<ReplyVo | undefined>>("hoveredReply");

const handleShowQuoteReply = (show: boolean) => {
  if (hoveredReply) {
    hoveredReply.value = show ? quoteReply.value : undefined;
  }
};

const isHoveredReply = computed(() => {
  return hoveredReply?.value?.metadata.name === props.reply.metadata.name;
});

// upvote
const upvotedReplies = inject<Ref<string[]>>("upvotedReplies", ref([]));
const handleUpvote = async () => {
  if (!props.reply) {
    return;
  }

  if (upvotedReplies.value.includes(props.reply.metadata.name)) {
    return;
  }

  await apiClient.tracker.upvote({
    voteRequest: {
      name: props.reply.metadata.name,
      plural: "replies",
      group: "content.halo.run",
    },
  });

  upvotedReplies.value.push(props.reply.metadata.name);

  emit("reload");
};
</script>

<template>
  <div
    :id="`reply-${reply.metadata.name}`"
    class="reply-item py-3"
    :class="{ 'animate-breath': isHoveredReply }"
  >
    <div class="flex flex-row gap-3">
      <div class="reply-avatar">
        <VAvatar
          :src="reply?.owner?.avatar"
          :alt="reply?.owner?.displayName"
          size="sm"
          circle
        />
      </div>
      <div class="flex-1">
        <div class="reply-informations flex items-center">
          <div class="flex flex-auto items-center gap-3">
            <div class="text-sm font-medium dark:text-slate-50">
              <a
                v-if="website"
                class="hover:text-gray-600 dark:hover:text-slate-300"
                :href="website"
                target="_blank"
              >
                {{ reply?.owner.displayName }}
              </a>
              <span v-else>
                {{ reply?.owner.displayName }}
              </span>
            </div>
            <span
              class="text-xs text-gray-500 dark:text-slate-400"
              :title="formatDatetime(reply.spec.creationTime)"
            >
              {{ timeAgo(reply.spec.creationTime) }}
            </span>
            <span
              v-if="!reply?.spec.approved"
              class="text-xs text-gray-500 dark:text-slate-400"
            >
              审核中
            </span>
            <VTag
              v-if="false"
              rounded
              class="dark:!border-slate-600 dark:!bg-slate-700 dark:!text-slate-50"
            >
              Author
            </VTag>
          </div>
        </div>
        <div class="reply-content mt-2">
          <pre
            class="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-slate-200"
          ><a
              v-if="quoteReply"
              class="mr-1 inline-flex flex-row items-center gap-1 rounded bg-gray-200 py-0.5 px-1 text-xs font-medium text-gray-600 hover:text-blue-500 hover:underline dark:bg-slate-700 dark:text-slate-200 dark:hover:text-slate-100"
              :href="`#reply-${quoteReply.metadata.name}`"
              @mouseenter="handleShowQuoteReply(true)"
              @mouseleave="handleShowQuoteReply(false)"
            >
              <MdiReply />
              <span>{{ quoteReply.owner.displayName }}</span>
            </a><br v-if="quoteReply" />{{
              reply.spec.content
            }}</pre>
        </div>
        <div class="reply-actions mt-2 flex flex-auto items-center gap-1">
          <div
            class="inline-flex cursor-pointer select-none items-center gap-1 text-xs text-gray-600 hover:text-gray-900 dark:text-slate-500 dark:hover:text-slate-400"
            @click="handleUpvote()"
          >
            <MdiCardsHeartOutline
              v-if="!upvotedReplies.includes(reply?.metadata.name as string)"
              class="h-3.5 w-3.5 hover:text-red-600 hover:dark:text-red-400"
            />
            <MdiCardsHeart
              v-else
              class="h-3.5 w-3.5 text-red-600 dark:text-red-400"
            />
            <span>
              {{ reply.stats.upvote }}
            </span>
          </div>
          <span class="text-gray-600">·</span>
          <span
            class="cursor-pointer select-none text-xs text-gray-600 hover:text-gray-900 dark:text-slate-500 dark:hover:text-slate-400"
            @click="showForm = !showForm"
          >
            回复
          </span>
        </div>
        <Form
          v-if="showForm"
          class="mt-2"
          :comment="comment"
          :reply="reply"
          @created="onReplyCreated"
        />
      </div>
    </div>
  </div>
</template>
