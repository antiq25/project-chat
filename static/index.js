const Popover = require('@pirxpilot/popover');
const Emitter = require('component-emitter');

/*global document*/

function clickOutside(elements, fn) {
  const self = {
    on,
    off,
    isClicked
  };

  let clickedEl;
  let handlers;

  function stop(e) {
    clickedEl = this;
    e.stopPropagation();
  }

  function pass() {
    clickedEl = undefined;
    fn();
  }

  function isClicked(el) {
    return el === clickedEl;
  }

  function on() {
    const html = document.documentElement;
    handlers = elements.map(function(el) {
      const handler = stop.bind(el);
      el.addEventListener('mousedown', handler);
      return handler;
    });
    html.addEventListener('mousedown', pass);
    return self;
  }

  function off() {
    const html = document.documentElement;
    html.removeEventListener('mousedown', pass);
    elements.forEach(function(el, i) {
      el.removeEventListener('mousedown', handlers[i]);
    });
    return self;
  }

  return self;
}

function useFocus(el) {
  const tag = el.tagName.toLowerCase();
  if (tag === 'input') {
    const { type } = el;
    return type === 'text' || type === 'time' || type === 'date';
  }
  return (tag === 'textarea' || tag === 'select');
}

class Picker extends Emitter {
  constructor(el, item) {
    super();
    if (!(this instanceof Picker)) return new Picker(el, item);
    Emitter.call(this);
    this.el = el;
    this.item = item.on('change', (...args) => this.onchange(...args));
    this._hasComplete = 'isComplete' in this.item;
    if (useFocus(el)) {
      el.addEventListener('focus', () => this.onfocus());
      el.addEventListener('blur', () => this.onblur());
    } else {
      el.addEventListener('click', () => this.onclick());
    }
  }

  onclick() {
    if (this.el.disabled) {
      return;
    }
    this.show();
  }

  onfocus() {
    this.show();
  }

  onblur() {
    if (!this.clickOutside.isClicked(this.popover.el)) {
      this.hide();
    }
  }

  onchange(v, complete) {
    this.emit('change', v, complete);
    if (complete || !this._hasComplete) {
      this.hide();
    }
  }

  position(v) {
    this._position = v;
    return this;
  }

  show() {
    if (this._visible) {
      return;
    }
    this._visible = true;
    if (!this.popover) {
      this.popover = new Popover(this.item.el)
        .on('show', () => {
          this.clickOutside.on();
          this.emit('show');
        })
        .on('hide', () => this.emit('hide'));
      this.clickOutside = clickOutside([this.el, this.popover.el], () => this.hide());
      this.popover.classname = 'picker popover';
      if (this._position) {
        this.popover.position(this._position);
      }
    }
    if (this._hasComplete) {
      this.item.resetComplete();
    }
    this.popover.show(this.el);
  }

  hide() {
    if (!this._visible) {
      return;
    }
    this._visible = false;
    if (this._hasComplete && !this.item.isComplete()) {
      this.emit('change', this.item.selected, true);
    }
    this.clickOutside.off();
    this.popover.hide();
    return this;
  }
}

module.exports = Picker;
