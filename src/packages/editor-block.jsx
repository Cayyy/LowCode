import { computed, defineComponent, inject, onMounted, ref } from "vue";
import "./editor-block.scss"

export default defineComponent({
    props: {
        block: { type: Object }
    },
    setup(props) {
        const blockStyles = computed(() => ({
            top: `${props.block.top}px`,
            left: `${props.block.left}px`,
            zIndex: `${props.block.zIndex}`,
        }));
        const config = inject('config'); // 来自 APP.vue 导出

        const blockRef = ref(null);
        // 渲染事件
        onMounted(() => {
            // console.log(blockRef.value)
            // 组织组件渲染所需的数据
            let { offsetWidth, offsetHeight } = blockRef.value;
            if (props.block.alignCenter) {
                // 拖拽松手时渲染的组件
                props.block.left = props.block.left - offsetWidth / 2;
                props.block.top = props.block.top - offsetHeight / 2;
                props.block.alignCenter = false;
            }

            // 组件的宽高
            props.block.width = offsetWidth;
            props.block.height = offsetHeight;


        });

        return () => {
            // 通过block的key属性，获取对应的组件
            console.log(props)
            const component = config.componentMap[props.block.key];
            // 获取render函数
            const RenderComponent = component.render()
            return <div class="editor-block" style={blockStyles.value} ref={blockRef}>
                {RenderComponent}
            </div>
        }
    }
})