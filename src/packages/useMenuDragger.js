/**
 * 左侧组件拖拽事件
 * @param {*} containerRef 绘制区域对象
 * @param {*} data 组件配置信息
 * @returns 
 */
import {events} from './events';
export function useMenuDragger(containerRef, data){
    /**
         * 当前拖拽中的组件
         */
    let currentComponent = null;
    const dragenter = (e) => {
        e.dataTransfer.dropEffect = 'move' // 修改H5拖动的图标为移动中
    }
    const dragover = (e) => {
        e.preventDefault()
    }
    const dragleave = (e) => {
        e.dataTransfer.dropEffect = 'none' // 修改H5拖动的图标为禁止
    }
    const drop = (e) => {
        // console.log(currentComponent)
        let blocks = data.value.blocks; // 内部已经渲染的组件
        data.value = {
            ...data.value, // 原来配置的所有内容
            blocks: [
                ...blocks, // blocks字段先引用原来所有的值
                {
                    key: currentComponent.key,
                    top: e.offsetY, // 相对事件对象的坐标
                    left: e.offsetX, // 相对事件对象的坐标
                    zIndex: 1,
                    alignCenter: true, // 标识松手的时候，组件的中间在鼠标的位置
                }
            ]
        }
        currentComponent = null;
    }

    // 开始拖拽事件
    const dragstart = (e, component) => {
        // dragenter 进入元素，添加一个移动的标识
        // dragover 在目标元素经过，必须阻止默认行为，否则不能触发drop
        // dragleave 离开元素的时候，需要添加一个禁用标识
        // drop 松手的时候，根据拖拽的组件，添加一个组件
        containerRef.value.addEventListener('dragenter', dragenter)
        containerRef.value.addEventListener('dragover', dragover)
        containerRef.value.addEventListener('dragleave', dragleave)
        containerRef.value.addEventListener('drop', drop)
        currentComponent = component
        events.emit('start') // 触发事件
    }

    // 拖拽结束事件
    const dragend=(e)=>{
        containerRef.value.removeEventListener('dragenter', dragenter)
        containerRef.value.removeEventListener('dragover', dragover)
        containerRef.value.removeEventListener('dragleave', dragleave)
        containerRef.value.removeEventListener('drop', drop)
        events.emit('end') // 触发事件
    }

    return {
        dragstart,
        dragend
    }
}