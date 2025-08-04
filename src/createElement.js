/**
* 
* @param {string} nodeName
* @param {object} attributes
* @param {HTMLElement[]} children
* @returns HTMLElement
*/
export default function _(name, textOrAttr, childs) {
  var element = null;
  if ("text" === name) {
    return document.createTextNode(textOrAttr);
  }
  switch (name) {
    case CREATE_FRAGMENT: {
      element = document.createDocumentFragment();
      break;
    }
    default: {
      element = document.createElement(name);
    }
  }
  for (var attr in textOrAttr) {
    if ("style" === attr) {
      for (var style in textOrAttr.style) {
        element.style[style] = textOrAttr.style[style];
      }
    }
    else if ("className" === attr) {
      element.className = textOrAttr[attr];
    }
    else if ("event" === attr) {
      for (var event in textOrAttr.event) {
        element.addEventListener(event, textOrAttr.event[event]);
      }
    }
    else {
      element.setAttribute(attr, textOrAttr[attr]);
    }
  }
  if (childs) {
    if ("string" == typeof childs) {
      element.innerHTML = childs;
    } else if (Array.isArray(childs)) {
      for (var l = 0; l < childs.length; l++) {
        if (null != childs[l]) {
          element.appendChild(childs[l]);
        }
      }
    }
  }
  return element
}

export const CREATE_FRAGMENT = Symbol('fragment_element_marker');
