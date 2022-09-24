//todo syntax:
// normal sync reaction: "click:log:bob"
// once sync reaction: ":timeout50:log:bob"
// normal sync reaction+default action: (filter1:filter2) with default action(log:open): "click:filter1:filter2::log:open:"
// once sync reaction+default action: (filter1:filter2) with default action(log:open): ":click:filter1:filter2::log:open:"

function deprecate(name) {
  return function deprecated() {
    throw `${name}() is deprecated`;
  }
}

(function (Element_proto, EventTarget_proto, documentCreateAttributeOG,) {
  const removeAttrOG = Element_proto.removeAttribute;
  const getAttrNodeOG = Element_proto.getAttributeNode;
  const setAttributeNodeOG = Element_proto.setAttributeNode;
  Element.prototype.hasAttributeNS = deprecate("Element.hasgetAttributeNS");
  Element.prototype.getAttributeNS = deprecate("Element.getAttributeNS");
  Element.prototype.setAttributeNS = deprecate("Element.setAttributeNS");
  Element.prototype.removeAttributeNS = deprecate("Element.removeAttributeNS");
  Element.prototype.getAttributeNode = deprecate("Element.getAttributeNode");
  Element.prototype.setAttributeNode = deprecate("Element.setAttributeNode");
  Element.prototype.removeAttributeNode = deprecate("Element.removeAttributeNode");
  Element.prototype.getAttributeNodeNS = deprecate("Element.getAttributeNodeNS");
  Element.prototype.setAttributeNodeNS = deprecate("Element.setAttributeNodeNS");
  Element.prototype.removeAttributeNodeNS = deprecate("Element.removeAttributeNodeNS");
  document.createAttribute = deprecate("document.createAttribute");

  let eventLoop = [];
  EventTarget_proto.dispatchEvent = function dispatchEvent(event) {
    eventLoop.push({target: this, event});
    if (eventLoop.length > 1)
      return;
    while (eventLoop.length) {
      const {target, event} = eventLoop[0];
      for (let t = target; t; t = t.assignedSlot || t.parentElement || t.parentNode?.host) {
        for (let attr of t.attributes)
          if (attr.event === event.type)
            customEventFilters.callFilter(attr, event);
      }
      eventLoop.shift();
    }
  }

  Element_proto.setAttribute = function (name, value) {
    if (this.hasAttribute(name)) {
      const at = getAttrNodeOG.call(this, name);
      const oldValue = at.value;
      at.value = value;
      at.changeCallback?.(oldValue);
    } else {
      const at = documentCreateAttributeOG.call(document, name);
      if (value !== undefined)
        at.value = value;
      setAttributeNodeOG.call(this, at);
      customEvents.upgrade(at);
      at.changeCallback?.(undefined);
    }
  };

  Element_proto.removeAttribute = function (name) {
    getAttrNodeOG.call(this, name).destructor?.();
    removeAttrOG.call(this, name);
  };
})(Element.prototype, EventTarget.prototype, document.createAttribute);

ElementObserver.end(el => customEvents.upgrade(...el.attributes));