import {render, html} from '../../node_modules/lit-html/lib/lit-extended';
import css from './appbar.css';
import {repeat} from '../../node_modules/lit-html/lib/repeat';

class Appbar extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({mode: 'open'});
    this.ds = [];
  }

  get data() {
    return this.dataValue;
  }

  set data(val) {
    this.ds = val.ds;
    this.dsChangeCallBack = val.dsChange;
    this.dataValue = val.items;
    this.clearCallback = this.clearCallback || val.clearCallback;
    this.backCallback = this.backCallback || val.backCallback;
    this.forwardCallback = this.forwardCallback || val.forwardCallback;
    this.listDisabled = false;
    this.invalidate();
  }

  toggleListEnablement() {
    this.listDisabled = !this.listDisabled;
    if (this.shadowRoot.innerHTML.length > 0) {
      const list = this.shadowRoot.querySelector('.app-bar').querySelector('select');
      if (this.listDisabled) {
        list.style.opacity = 0.5;
        list.disabled = true;
      } else {
        list.disabled = false;
        list.style.opacity = '';
      }
    }
  }

  _changeDS(e) {
    this.dsChangeCallBack(e.value);
  }

  _clearCallback() {
    this.clearCallback();
  }

  _forwardCallback() {
    this.forwardCallback();
  }

  _backCallback() {
    this.backCallback();
  }

  invalidate() {
    if (!this.needsRender) {
      this.needsRender = true;
      Promise.resolve().then(() => {
        this.needsRender = false;
        render(this.template(), this.root);
      });
    }
  }

  connectedCallback() {
    this.invalidate();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(name);
    if (name === 'app-bar-title') {
      this.title = newValue;
    }
    this.invalidate();
  }

  template() {
    /* eslint-disable */
    return html`
        <style>
        ${css}
        </style>
        <div class="app-bar">
                <img class="icon" src="src/assets/cppg.svg" alt="Core Power Playground">
                <span class="app-title">Core Power Playground</span>
            <div>
              <div class="buttons">
                <button on-click="${() => {
      this._clearCallback();
    }}" >Clear all</button>
                <button on-click="${() => {
      this._backCallback();
    }}" >Back</button>
                <button on-click="${() => {
      this._forwardCallback();
    }}" >Forward</button>
                <div class="divider"></div>
                <span>|</span>
                <select onchange="${(e) => {
      this._changeDS(e.target);
    }}">
                  ${repeat(this.ds, d => d.toString(), d => html` <option value="${d}">${d}</option>`)}
                </select>
              </div>
            </div>
        </div>
      `;
    /* eslint-enable */
  }
}

customElements.define('app-bar', Appbar);
