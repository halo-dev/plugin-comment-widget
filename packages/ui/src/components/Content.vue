<script lang="ts" setup>
import '@halo-dev/comment-widget';

defineProps<{
  content: string;
}>();
</script>
<template>
  <comment-content
    :content="content"
    style="--halo-cw-content-img-max-width: 50%"
  ></comment-content>
</template>
