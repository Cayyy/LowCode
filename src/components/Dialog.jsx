import { ElButton, ElDialog, ElInput } from 'element-plus'
import { createVNode, defineComponent, reactive, render } from 'vue'

// 定义一个组件
const DialogComponent = defineComponent({
  props: {
    returnoption: { type: Object },
  },
  setup(props, ctx) {
    const state = reactive({
      option: props.option, // 用户给组件的属性
      isShow: false,
    })

    // 指定组件对外暴漏方法
    ctx.expose({
      showDialog(option) {
        console.log(option)
        state.option = option
        state.isShow = true
      },
    })

    const onCancel = () => {
      state.isShow = false
    }
    const onConfirm = () => {
      state.isShow = false
      state.option.onConfirm && state.option.onConfirm(state.option.content)
    }

    return () => {
      return (
        //<ElDialog v-model={state.isShow} title={state.option.title}>
        <ElDialog v-model={state.isShow}>
          {{
            default: () => (
              <ElInput
                type="textarea"
                v-model={state.option.content}
                rows={10}
              ></ElInput>
            ),
            footer: () =>
              state.option.footer && (
                <div>
                  <ElButton onClick={onCancel}>取消</ElButton>
                  <ElButton type="primary" onClick={onConfirm}>
                    确定
                  </ElButton>
                </div>
              ),
          }}
        </ElDialog>
      )
    }
  },
})

let vm
export function $dialog(option) {
  if (!vm) {
    // element-plus 中有el-dialog组件
    // 手动挂载组件
    let el = document.createElement('div')
    // 将组件渲染成虚拟节点
    vm = createVNode(DialogComponent, { option })
    // 将虚拟节点渲染到el中
    render(vm, el)
    // 将el添加到body
    document.body.appendChild(el)
  }
  // 取组件导出的函数
  let { showDialog } = vm.component.exposed
  showDialog(option)
}
