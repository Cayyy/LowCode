import { computed, ref } from 'vue'
/**
 * 绘制区域内组件点击事件
 * @param {*} data
 * @param {*} callback 点击事件回调
 * @returns
 */
export function useFoucs(data, previewRef, callback) {
  /**
   * 当前选择下标，默认没有
   */
  const selectIndex = ref(-1)

  /**
   * 最后选择的组件
   */
  const lastSelectBlock = computed(() => {
    return data.value.blocks[selectIndex.value]
  })

  /**
   * 获取组件选中和未选中的组件
   */
  const focusData = computed(() => {
    let focus = []
    let unfocused = []
    data.value.blocks.forEach((block) => (block.focus ? focus : unfocused).push(block))
    return { focus, unfocused }
  })

  /**
   * 清空其他block的选中状态
   */
  const clearBlockFocus = () => {
    data.value.blocks.forEach((block) => (block.focus = false))
  }
  /**
   * 点击block
   */
  const blockMousedown = (e, block, index) => {
    // 预览模式不处理
    if (previewRef.value) {
      return
    }

    // block上定义一个获取焦点的属性 focus
    e.preventDefault() // 阻止事件的默认行为
    e.stopPropagation() // 停止穿透事件

    if (e.shiftKey) {
      if (focusData.value.focus.length <= 1) {
        // 保证至少选择一个组件
        block.focus = true
      } else {
        block.focus = !block.focus
      }
    } else {
      if (block.focus) {
        // 当自己已经被选中了，再次点击还是选中状态
        // block.focus = false;
      } else {
        clearBlockFocus()
        block.focus = true
      }
    }

    selectIndex.value = index
    callback(e)
  }

  /**
   * 点击空白区域（容器），清空所有选中
   */
  const containerMousedown = () => {
    // 预览模式不处理
    if (previewRef.value) {
      return
    }

    clearBlockFocus()
    selectIndex.value = -1
  }

  return {
    blockMousedown,
    containerMousedown,
    focusData,
    lastSelectBlock,
    clearBlockFocus,
  }
}
