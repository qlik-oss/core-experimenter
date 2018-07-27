import { render, html } from '../../node_modules/lit-html/lib/lit-extended';
import css from './listbox.css';

const tmpdata = {
  stuff: 1,
  stuff1: 2,
  stuff2: 3,
  stuff3: 4,
  stuff4: 5,
};

const title = 'title';


class ListBox extends HTMLElement {
  constructor() {
    super();
    this.dataValue = tmpdata;
    this.filterQuery = '';
    this.root = this.attachShadow({ mode: 'open' });
  }

  get data() {
    return this.dataValue;
  }

  set data(val) {
    // ToDo: implement validation
    this.dataValue = val;
    render(this.template(), this.root);
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
    render(this.template(), this.root);
  }

  template() {
    return html`
      <style>
        ${css}
      </style>
      <div class="list-box">
        <div class="header">
          <div class="title">
            ${title}<div class="icon clear_selections" on-click="${() => { this._reset(); }}">&#x232B;</div>
          </div>
          <div class="filter">
            <div class="icon search">&#x26B2;</div>
            <input class="search_input" maxlength="255" placeholder="Filter" spellcheck="false" type="text" on-keyup="${(e) => { this._searchFilter(e.target); }}"/>
            <div class="icon cancel" on-click="${() => { this._cancelFilter(); }}">x</div>
          </div>
        </div>
        <ul>
          ${Object.keys(this.data).filter(key => this.data[key].toString().indexOf(this.filterQuery) !== -1).map(key => html`<li>${key} - ${this.data[key]}</li>`)}
        </ul>
      </div>
    `;
  }
}
customElements.define('list-box', ListBox);
