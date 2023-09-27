import { reactive } from "vue";
import { events } from "./events";

/**
 * 
 * @param {*} focusData 
 * @param {*} lastSelectBlock 最后选择的组件，用于生成辅助线
 * @returns 
 */
export function useBlockDragger(focusData, lastSelectBlock, data) {

    let dragState = {
        startX: 0, // 相对于整个窗口的位置
        startY: 0,  // 相对于整个窗口的位置
        dragging: false, // 是否正在拖拽中
    };

    // 画线
    let markLine = reactive({
        x: null,
        y: null
    })

    const mousedown = (e) => {
        console.log(lastSelectBlock.value)

        // 拖拽的最后的元素
        const { width: BWidth, height: BHeight } = lastSelectBlock.value

        dragState = {
            startX: e.clientX,
            startY: e.clientY,
            startLeft: lastSelectBlock.value.left,  // B对象拖拽前的位置left
            startTop: lastSelectBlock.value.top,// B对象拖拽前的位置top
            dragging: false,

            startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })), // 记录每个选中的位置
            lines: (() => {
                // 获取其他没有选中的组件，以他们的位置计算辅助线
                const { unfocused } = focusData.value;

                // 计算需要画线的位置, x: 纵向的线, y: 横向的线
                let lines = { x: [], y: [] };
                [
                    ...unfocused,
                    {
                        top: 0,
                        left: 0,
                        width: data.value.container.width,
                        height: data.value.container.height
                    }
                ].forEach((block) => {
                    const { top: ATop, left: ALeft, width: AWidth, height: AHeight } = block;


                    //当此元素拖拽到和A元素top一致的时候，要显示这根辅助线，辅助线的位置就是ATop
                    // showTop: 线显示的位置, top: 显示条件
                    lines.y.push({ showTop: ATop, top: ATop }); // 顶对顶
                    lines.y.push({ showTop: ATop, top: ATop - BHeight }); //顶对底
                    lines.y.push({ showTop: ATop + AHeight / 2, top: ATop + AHeight / 2 - BHeight / 2 }); //中对中
                    lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight }); // 底对顶
                    lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight - BHeight }); //底对底


                    lines.x.push({ showLeft: ALeft, left: ALeft }); //左对左边
                    lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth }); // 右边对左边
                    lines.x.push({ showLeft: ALeft + AWidth / 2, left: ALeft + AWidth / 2 - BWidth / 2 })
                    lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth - BWidth })
                    lines.x.push({ showLeft: ALeft, left: ALeft - BWidth }) // 左对右
                })
                console.log("可能出现的辅助线位置", lines)
                return lines;
            })(),
        }
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
    }


    const mousemove = (e => {
        let { clientX: moveX, clientY: moveY } = e;// 取e里的参数并重命名

        if (!dragState.dragging) {
            dragState.dragging = true;
            events.emit('start'); // 开始拖拽，记录状态，用于撤销
        }

        // 计算当前元素最新的1eft和top去线里面找，找到显示线
        // 鼠标移动后-鼠标移动前+ left就好了
        let left = moveX - dragState.startX + dragState.startLeft;
        let top = moveY - dragState.startY + dragState.startTop;
        // 先计算横线距离参 照物元素还有5像素的时候就显示这根线
        let x, y = null;
        for (let i = 0; i < dragState.lines.y.length; i++) {
            const { top: t, showTop: s } = dragState.lines.y[i]; //获取每一根线

            //如果小于五说明接近了,实现快速和这个元素贴在一起
            if (Math.abs(t - top) < 5) {
                y = s; //线要现实的位置
                moveY = dragState.startY - dragState.startTop + t; // 容器举例顶部的位置 + 目标的高度就是最新的moveY
                break; //找到一根线后就跳出循环
            }
        }
        for (let i = 0; i < dragState.lines.x.length; i++) {
            const { left: l, showLeft: s } = dragState.lines.x[i]; //获取每一 根线
            //如果小于五说明接近了,实现快速和这个元素贴在一起
            if (Math.abs(l - left) < 5) {
                x = s; //线要现实的位置
                moveX = dragState.startX - dragState.startLeft + l;
                break; //找到一根线后就跳出循环
            }
        }
        markLine.x = x;
        markLine.y = y;


        let durX = moveX - dragState.startX; // 之前和之后的距离
        let durY = moveY - dragState.startY;

        focusData.value.focus.forEach((block, idx) => {
            block.top = dragState.startPos[idx].top + durY;
            block.left = dragState.startPos[idx].left + durX;

        })
    })

    // 拖拽结束
    const mouseup = (e => {
        document.removeEventListener('mousemove', mousemove)
        document.removeEventListener('mouseup', mouseup)
        markLine.x = null;
        markLine.y = null

        if (dragState.dragging) {
            dragState.dragging = false;
            events.emit('end');
        }
    })

    return {
        mousedown,
        /**
         * 辅助线
         */
        markLine
    }
}