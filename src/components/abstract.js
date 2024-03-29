import {createElement} from './utils.js';

class AbstractComponent {
  constructor() {
    if (new.target === AbstractComponent) {
      throw new Error(`Can't instantiate AbstractComponent, only concrete one.`);
    }
    this._element = null;
  }

  getTemplate() {
    throw new Error(`Abstract method not implemented: getTemplate`);
  }

  getElement() {
    if (!this._element) {
      this._element = createElement(this.getTemplate());
    }
    return this._element;
  }

  removeElement() {
    this._element = null;
  }

  hide() {
    this._element.classList.add(`visually-hidden`);
  }

  show() {
    this._element.classList.remove(`visually-hidden`);
  }
}

export default AbstractComponent;
