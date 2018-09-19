import { render, html } from '../../node_modules/lit-html/lib/lit-extended';
import css from './appbar.css';
import { repeat } from '../../node_modules/lit-html/lib/repeat';

class Appbar extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.ds = [];
  }

  static get observedAttributes() {
    return ['variant', 'app-bar-title'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && name === 'variant') {
      this.root.querySelector('.app-bar').classList.toggle('dark');
    }
    if (oldValue !== newValue && name === 'app-bar-title') {
      this.title = newValue;
      this.invalidate();
    }
  }

  /* exposing gelements to the outside */
  getElementById(id) {
    return this.root.querySelector(`#${id}`);
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
    this.helpGuide = this.helpGuide || val.helpGuide;
    this.invalidate();
  }

  disableListEnablement(setDisabled) {
    const appBarEl = this.root.querySelector('.app-bar');
    if (appBarEl && appBarEl.innerHTML.length > 0) {
      const list = appBarEl.querySelector('#database');
      if (setDisabled) {
        list.style.opacity = 0.5;
        list.disabled = true;
      } else {
        list.disabled = false;
        list.style.opacity = '';
      }
    }
  }

  _helpGuide() {
    this.helpGuide();
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
    if (this.helpGuide) {
      const btn = this.root.getElementById('guideButton');
      btn.disabled = false;
      btn.style.opacity = '';
    }
  }

  connectedCallback() {
    this.invalidate();
  }

  template() {
    /* eslint-disable */
    return html`
        <style>
        ${css}
        </style>
        <div class="app-bar">
                <img class="icon" src="assets/cppg.svg" alt="Qlik Core Experimenter">
                <div id="guideButtonHolder">
                 <button id="guideButton" style="opacity: 0" disabled on-click="${() => { this._helpGuide(); }}">Guide</button></div>
                <span class="app-title">Qlik Core Experimenter</span>
            <div>
              <div class="buttons">
                <button id="clearButton" on-click="${() => { this._clearCallback(); }}" >Clear all</button>
                <button id="backButton" on-click="${() => { this._backCallback(); }}" >Back</button>
                <button id="forwardButton" on-click="${() => { this._forwardCallback(); }}" >Forward</button>
                <span class="divider">|</span>
                <div title="Database" class="db-logo"></div>
                <select id="database" onchange="${(e) => this._changeDS(e.target)}">
                  ${repeat(this.ds, d => d.toString(), d => html` <option value="${d}">${d}</option>`)}
                </select>
                <span class="divider">|</span>
                <slot></slot>
              </div>
            </div>
        </div>
      `;
    /* eslint-enable */
  }
}

customElements.define('app-bar', Appbar);
