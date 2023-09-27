import deepcopy from 'deepcopy'
import { events } from './events'
import { onUnmounted } from 'vue'

export function useCommand(data, focusData) {
  const state = {
    current: -1, // 前进后退的索引
    queue: [], // 存放所有的操作命令
    commands: {}, // 制作命令和执行功能的映射表
    commandArray: [], // 存放所有的命令
    destroyArray: [],
  }

  const registry = (command) => {
    state.commandArray.push(command)
    // 命令名对应执行函数
    state.commands[command.name] = (...args) => {
      const { redo, undo } = command.execute(...args)
      redo()
      if (!command.pushQueue) {
        return
      }
      let { queue, current } = state

      // 撤回修改队列
      if (queue.length > 0) {
        queue.slice(0, current + 1) // 在防止的过程中可能有撤销，所以根据最新的current值来计算新的队列
        state.queue = queue
      }

      queue.push({ redo, undo }) // 保存指令的前进后退
      state.current = current + 1
      console.log(state.current)
    }
  }

  // 重做
  registry({
    name: 'redo',
    keyboard: 'ctrl+y',
    execute() {
      // 执行
      return {
        redo() {
          console.log('重做')

          // 还原下一步
          let item = state.queue[state.current + 1]
          if (item) {
            item.redo && item.redo()
            state.current++
            console.log(state.current)
          }
        },
      }
    },
  })

  // 撤销
  registry({
    name: 'undo',
    keyboard: 'ctrl+z', // 快捷键
    execute() {
      // 执行
      return {
        redo() {
          console.log('撤销')
          if (state.current == -1) {
            return
          }

          // 还原上一步
          let item = state.queue[state.current]
          if (item) {
            item.undo && item.undo()
            state.current--
            console.log(state.current)
          }
        },
      }
    },
  })

  // 如果希望将操作放到队列中，可以添加一个属性、标识，等会操作要放到队列中
  registry({
    name: 'drag',
    // 放到队列中
    pushQueue: true,
    // 初始化操作，默认执行
    init() {
      // 之前的数据
      this.before = null

      // 监控拖拽开始事件，保存组件状态
      const start = () => {
        // debugger;
        this.before = deepcopy(data.value.blocks)
      }
      // 监控拖拽结束事件，出发对应的指令
      const end = () => {
        // debugger;
        state.commands.drag()
      }
      events.on('start', start)
      events.on('end', end)

      return () => {
        events.off('start', start)
        events.off('end', end)
      }
    },
    // 执行函数
    execute() {
      let before = this.before
      let after = data.value.blocks

      return {
        // 默认拖拽结束，就把当前的事做了
        redo() {
          data.value = { ...data.value, blocks: after }
        },
        // 还原上一步状态
        undo() {
          data.value = { ...data.value, blocks: before }
        },
      }
    },
  })

  // 带有历史记录的操作，都可以参考该方法
  registry({
    name: 'updateContainer', // 更新整个容器
    pushQueue: true, // 是否压入队列
    execute(newValue) {
      let state = {
        before: data.value, // 当前的值
        after: newValue, // 新值
      }
      return {
        redo: () => {
          data.value = state.after
        },
        undo: () => {
          data.value = state.before
        },
      }
    },
  })

  registry({
    name: 'placeTop', // 置顶
    pushQueue: true, // 是否压入队列
    execute() {
      let before = deepcopy(data.value.blocks)
      let after = (() => {
        let { focus, unfocused } = focusData.value

        // 找到当前最大的zIndex
        let maxZIndex = unfocused.reduce((prev, block) => {
          return Math.max(prev, block.zIndex)
        }, -Infinity)

        focus.forEach((block) => (block.zIndex = maxZIndex + 1)) // 让当前选中的比最大的zIndex+1
        return data.value.blocks
      })()

      return {
        redo: () => {
          data.value = { ...data.value, blocks: after }
        },
        undo: () => {
          // 如果blocks前后一致，不会更新
          data.value = { ...data.value, blocks: before }
        },
      }
    },
  })

  // 带有历史记录的操作，都可以参考该方法
  registry({
    name: 'placeBottom', // 置底
    pushQueue: true, // 是否压入队列
    execute() {
      let before = deepcopy(data.value.blocks)
      let after = (() => {
        let { focus, unfocused } = focusData.value

        // 找到当前最大的zIndex
        let minZIndex =
          unfocused.reduce((prev, block) => {
            return Math.min(prev, block.zIndex)
          }, Infinity) - 1

        // 如果index是负数，则让其他所有组件向上,自己变成0
        if (minZIndex < 0) {
          const dur = Math.abs(minZIndex)
          minZIndex = 0
          unfocused.forEach((block) => (block.zIndex += dur))
        }

        focus.forEach((block) => (block.zIndex = minZIndex)) // 让当前选中的比最大的zIndex+1
        return data.value.blocks
      })()

      return {
        redo: () => {
          data.value = { ...data.value, blocks: after }
        },
        undo: () => {
          // 如果blocks前后一致，不会更新
          data.value = { ...data.value, blocks: before }
        },
      }
    },
  })

  // 带有历史记录的操作，都可以参考该方法
  registry({
    name: 'delete', // 更新整个容器
    keyboard: 'delete',
    pushQueue: true, // 是否压入队列
    execute() {
      let state = {
        before: deepcopy(data.value.blocks), // 当前的值
        after: focusData.value.unfocused, // 选中的都删除了，留下的都是没选中的
      }
      return {
        redo: () => {
          data.value = { ...data.value, blocks: state.after }
        },
        undo: () => {
          data.value = { ...data.value, blocks: state.before }
        },
      }
    },
  })

  const KeyboardEvent = (() => {
    const keyCodes = {
      8: 'delete',
      46: 'delete',
      90: 'z',
      89: 'y',
    }
    const onKeydown = (e) => {
      const { ctrlKey, keyCode } = e //ctrl+z ctrl+y
      let keyString = []
      if (ctrlKey) {
        keyString.push('ctrl')
      }
      if (keyCode && keyCodes[keyCode]) {
        keyString.push(keyCodes[keyCode])
      }

      if (keyString.length > 1) {
        keyString = keyString.join('+')
      } else {
        keyString = keyString.join('')
      }
      console.log('按下 功能键', ctrlKey, '普通按键', keyCode, '最终按键', keyString)

      state.commandArray.forEach(({ keyboard, name }) => {
        console.log('支持的组合键' + keyboard)
        // 没有键盘事件
        if (!keyboard) {
          return
        }
        // 执行键盘事件
        if (keyboard === keyString) {
          state.commands[name]()
          e.preventDefault()
        }
      })
    }

    const init = () => {
      window.addEventListener('keydown', onKeydown)
      // 返回销毁事件
      return () => {
        window.removeEventListener('keydown', onkeydown)
      }
    }
    return init
  })()

  // 注册并绑定卸载方法
  ;(() => {
    // 监听键盘事件
    state.destroyArray.push(KeyboardEvent())

    state.commandArray.forEach((command) => command.init && state.destroyArray.push(command.init()))
  })()

  // 卸载
  onUnmounted(() => {
    // 清理绑定的时间
    state.destroyArray.forEach((fn) => fn && fn())
  })
  return state
}
