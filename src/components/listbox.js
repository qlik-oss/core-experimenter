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
          <div class="title">${title}</div><a href="javascript:void(0);" class="icon">clear</a>
          <div class="filter">
            <input class="search_input" maxlength="255" placeholder="Search" spellcheck="false" type="text" on-keyup="${(e) => {
    this._searchFilter(e.target);
  }}"/>
            <a href="javascript:void(0);" class="icon" on-click="${() => {
    this._resetFilter();
  }}">X</a>
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
