<script lang="ts" setup>
import '@halo-dev/comment-widget';
import type { CommentEditor } from '@halo-dev/comment-widget';
import { onMounted, ref } from 'vue';

const props = defineProps<{
  autoFocus?: boolean;
}>();

const emit =
  defineEmits<
    (e: 'update', content: { content: string; characterCount: number }) => void
  >();

const editorRef = ref<InstanceType<typeof CommentEditor>>();

onMounted(() => {
  if (props.autoFocus) {
    editorRef.value?.setFocus();
  }

  editorRef.value?.addEventListener('update', (e) => {
    const detail = (e as CustomEvent).detail;
    emit('update', {
      content: detail.content,
      characterCount: detail.characterCount ?? 0,
    });
  });
});
</script>
<template>
  <comment-editor ref="editorRef" keep-alive></comment-editor>
</template>
