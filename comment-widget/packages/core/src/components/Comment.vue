<script lang="ts" setup>
defineProps({
  msg: {
    type: String,
    default: "World",
  },
});
</script>
<template>
  <div class="msg">Hello, {{ msg }}</div>
</template>
<style scoped>
.msg {
  color: red;
}
</style>
