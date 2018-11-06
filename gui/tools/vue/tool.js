const GUI = require('gui/gui');
export default {
  name: "tool",
  functional: true,
  render(createElement, { props }) {
    const tool = props.tool;
    if (tool.type === 'checkbox') {
      return createElement('div', {
        class: {
          checkbox: true
        }
      }, [
        createElement('label', {
        }, [
          createElement('input', {
            style: {
              cursor: 'pointer',
            },
            attrs: {
              id: tool.layerName,
              type: 'checkbox',
              value: tool.layerName,
              checked: tool.isCheck
            },
            on: {
              click: tool.action,
              input(event) {
                tool.isCheck = event.target.checked;
              }
            }
          })
        ], tool.name),
      ]);
    } else {
      return createElement('div', {
        class: {
          tool: true
        },
        on: {
          click: tool.action
        }
      }, [
        createElement('i', {
          style: {
            width: '20px'
          },
          attrs: {
            class: GUI.getFontClass('caret-right')
          }
        }),
        createElement('span', {
          style : {}
        }, tool.name)
      ]);
    }

  }
}
// <div v-if="tool.type == 'checkbox' " class="checkbox">
//   <label>
//   <input style="cursor:pointer"
// :id="tool.layerName"
// v-model="tool.isCheck"
// type="checkbox"
// :value="tool.layerName"
// @click="fireAction(tool)">
//   {{ tool.name }}
// </label>
// </div>
// <div v-else class="tool" @click="fireAction(tool)">
//   <i :class="g3wtemplate.getFontClass('caret-right')"></i>
//   <span >{{ tool.name }}</span>
// </div>
