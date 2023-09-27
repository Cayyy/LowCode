<template>
  <div class="app">
    <Editor v-model="state"></Editor>
  </div>
</template>

<script>
import { ref } from '@vue/reactivity'
import data from './data.json'
import Editor from './packages/eidtor'
import { registerConfig as config } from './utils/editor-config'
import { provide } from 'vue'

export default {
  components: {
    Editor,
  },
  setup() {
    const state = ref(data)

    // 将组件的配置直接传入
    provide('config', config)

    return {
      state,
    }
  },
}
</script>

<style lang="scss">
.app {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  background: yellow;
}
</style>
