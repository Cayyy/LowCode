// 编辑器
import { computed, defineComponent, inject, onMounted, ref } from 'vue'
import './editor.scss'
import EditorBlock from './editor-block'
import deepcopy from 'deepcopy'
import { useMenuDragger } from './useMenuDragger'
import { useFoucs } from './useFocus'
import { useBlockDragger } from './useBlockDragger'
import { useCommand } from './useCommand'
import { $dialog } from '@/components/Dialog'

export default defineComponent({
  // 传入的参数
  props: {
    // v-model
    modelValue: { type: Object },
  },
  emits: ['update:modelValue'], // 要触发的事件
  setup(props, ctx) {
    // 预览的时候不能操作，可以点击输入内容，方便查看效果
    const previewRef = ref(true)

    const data = computed({
      get() {
        return props.modelValue
      },
      set(newValue) {
        ctx.emit('update:modelValue', deepcopy(newValue))
      },
    })
    console.log(data.value)

    const containerStyles = computed(() => ({
      width: data.value.container.width + 'px',
      height: data.value.container.height + 'px',
    }))

    const config = inject('config')

    /**
     * 绘制区域对象
     */
    const containerRef = ref(null)
    // 1. 实现左侧物料区的拖拽功能
    const { dragstart, dragend } = useMenuDragger(containerRef, data)

    // 2. 绘制区域组件拖拽
    // 2.1. 实现绘制区域内组件获取焦点
    let { blockMousedown, containerMousedown, focusData, lastSelectBlock, clearBlockFocus } = useFoucs(data, previewRef, (e) => {
      // console.log("点击事件后，哪些组件被点击了", focusData.value.focus);
      mousedown(e)
    })
    // 2.2 实现组件的拖拽
    let { mousedown, markLine } = useBlockDragger(focusData, lastSelectBlock, data)

    // 3. 实现绘制区域内拖个组件拖拽
    const { commands } = useCommand(data, focusData)
    const buttons = [
      {
        label: '撤销',
        icon: 'iconfont icon-undo',
        handler: () => {
          commands.undo()
        },
      },
      {
        label: '重做',
        icon: 'iconfont icon-redo',
        handler: () => {
          commands.redo()
        },
      },
      {
        label: '导出',
        icon: 'icon-export',
        handler: () => {
          // 弹出对话框
          $dialog({
            title: '导出配置',
            content: JSON.stringify(data.value),
            footer: false,
          })
        },
      },
      {
        label: '导入',
        icon: 'icon-import',
        handler: () => {
          console.log('导入')
          $dialog({
            title: '导入配置',
            content: '',
            footer: true,
            onConfirm(text) {
              console.log(text)
              commands.updateContainer(JSON.parse(text))
            },
          })
        },
      },
      {
        label: '置顶',
        icon: 'iconfont icon-place-top',
        handler: () => {
          console.log('置顶')
          commands.placeTop()
        },
      },
      {
        label: '置底',
        icon: 'iconfont icon-place-bottom',
        handler: () => {
          console.log('置底')
          commands.placeBottom()
        },
      },
      {
        label: '删除',
        icon: 'iconfont icon-delete',
        handler: () => {
          console.log('删除')
          commands.delete()
        },
      },
      {
        label: () => (previewRef.value ? '编辑' : '预览'),
        icon: 'iconfont',
        handler: () => {
          previewRef.value = !previewRef.value
          clearBlockFocus()
        },
      },
    ]

    return () => (
      <div class="editor">
        <div class="editor-left">
          {/*左侧物料区*/}
          {/*根据配置列表，生成组件列表, 实现h5拖拽*/}
          {config.componentList.map((component) => (
            <div class="editor-left-item" draggable onDragstart={(e) => dragstart(e, component)} onDragend={dragend}>
              <span>{component.label}</span>
              <div>{component.preview()}</div>
            </div>
          ))}
        </div>

        {/* 菜单栏 */}
        <div class="editor-top">
          {buttons.map((btn, index) => {
            const icon = typeof btn.icon == 'function' ? btn.icon() : btn.icon
            const label = typeof btn.label == 'function' ? btn.label() : btn.label
            return (
              <div class="editor-top-button" onClick={btn.handler}>
                <i class={icon}></i>
                <span>{label}</span>
              </div>
            )
          })}
        </div>

        <div class="editor-right">属性控制</div>
        {/* 渲染部分 */}
        <div class="editor-container">
          {/* 负责产生滚动条 */}
          <div class="editor-container-canvas">
            {/* 产生内容区域 */}
            <div ref={containerRef} style={containerStyles.value} class="editor-container-canvas__content" onMousedown={(e) => containerMousedown()}>
              {/* 绘制组件 */}
              {data.value.blocks.map((block, index) => (
                <EditorBlock
                  class={block.focus ? 'editor-block-focus' : ''}
                  class={previewRef.value ? 'editor-block-preview' : ''}
                  block={block}
                  onMousedown={(e) => blockMousedown(e, block, index)}
                />
              ))}

              {/* 绘制拖拽辅助线 */}
              {markLine.x != null && <div class="line-x" style={{ left: markLine.x + 'px' }}></div>}
              {markLine.y != null && <div class="line-y" style={{ top: markLine.y + 'px' }}></div>}
            </div>
          </div>
        </div>
      </div>
    )
  },
})
