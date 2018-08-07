import { render, html } from '../../node_modules/lit-html/lib/lit-extended';
import { repeat } from '../../node_modules/lit-html/lib/repeat';
import css from './listbox.css';

import utils from '../utils/utils';

class ListBox extends HTMLElement {
  constructor() {
    super();
    this.titleValue = '';
    this.dataValue = {};
    this.clickCallback = null;
    this.filterQuery = '';
    this.colorBy = null;
    this.root = this.attachShadow({ mode: 'open' });
  }

  get data() {
    return this.dataValue;
  }

  set data(val) {
    // ToDo: implement validation
    this.titleValue = val.fieldName;
    this.dataValue = val.items;
    this.clickCallback = this.clickCallback || val.clickCallback;
    this.clearCallback = this.clearCallback || val.clearCallback;
    this.colorBy = val.colorBy;
    this.invalidate();
  }

  _searchFilter(inputEl) {
    this.filterQuery = inputEl.value;
    this.invalidate();
  }

  _cancelFilter() {
    this.filterQuery = '';
    this.root.querySelectorAll('.search_input')[0].value = '';
    this.invalidate();
  }

  _reset() {
    console.log('probably clear selections');
  }

  _clickCallback(item) {
    this.clickCallback({
      field: this.titleValue,
      id: item[0].qElemNumber,
    });
  }

  _clearCallback() {
    this.clearCallback(this.titleValue);
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

  template() {
    /* eslint-disable */
    return html`
      <style>
        ${css}
        .list-box {background-color:${this.colorBy(this.titleValue) + '22'}}
      </style>
      <div class="list-box">
        <div class="header" style="background-color:${this.colorBy(this.titleValue)}; opacity:0.8" >
          <div class="title" style="color:white">
            ${this.titleValue}<div class="icon clear_selections" on-click="${() => { this._clearCallback(); }}">&#x232B;</div>
          </div>
          <div class="filter"  style="background-color:white">
            <div class="icon search">&#x26B2;</div>
            <input class="search_input" maxlength="255" placeholder="Filter" spellcheck="false" type="text" on-keyup="${(e) => { this._searchFilter(e.target); }}"/>
            <div class="icon cancel" on-click="${() => { this._cancelFilter(); }}">x</div>
          </div>
        </div>
        <ul>
          ${repeat(Object.keys(this.data).filter(key => this.data[key][0].qText.indexOf(this.filterQuery) !== -1), key => this.data[key][0].qText, (key) => {
            return html`<li on-click="${() => { this._clickCallback(this.data[key]);}}" class$="${this.data[key][0].qState}">${this.data[key][0].qText} <span class="state" title="${utils.states[this.data[key][0].qState]}">${this.data[key][0].qState}</span></li>`;
          })}
        </ul>
      </div>
    `;
    /* eslint-enable */
  }
}
customElements.define('list-box', ListBox);
