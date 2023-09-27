import { ElButton, ElInput } from 'element-plus'

function createEditorConfig() {
  // 列表区可以显示所有的物料
  const componentList = []
  // 渲染区 key对应的组件映射关系
  const componentMap = {}

  return {
    componentList,
    componentMap,
    register: (component) => {
      componentList.push(component)
      componentMap[component.key] = component
    },
  }
}

export let registerConfig = createEditorConfig()

registerConfig.register({
  key: 'text',
  label: '文本',
  preview: () => '预览文本',
  render: () => '渲染文本',
})

registerConfig.register({
  key: 'button',
  label: '按钮',
  preview: () => <ElButton>预览按钮</ElButton>,
  render: () => <ElButton>渲染按钮</ElButton>,
})

registerConfig.register({
  key: 'input',
  label: '输入框',
  preview: () => <ElInput placeholder="预览输入框"></ElInput>,
  render: () => <ElInput placeholder="渲染输入框"></ElInput>,
})
