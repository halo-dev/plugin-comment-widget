<script lang="ts" setup>
import '@halo-dev/comment-widget';

defineProps<{
  content: string;
}>();
</script>
<template>
  <comment-content :content="content"></comment-content>
</template>
