import { render, html } from '../../node_modules/lit-html/lib/lit-extended';

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
    // this.data = input.value.length > 0 ? Object.keys(this.data).filter((key) => {
    //   return this.data[key].toString().indexOf(input.value) !== -1;
    // }).reduce((obj, key) => {
    //   obj[key] = this.data[key];
    //   return obj;
    // }, {}) : this.data;
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
        :host{
          border: 1px solid #666666;
          margin: 5px 0;
          border-radius: 4px;
          height: 400px;
          overflow: hidden;
          display: block;
        }
        ul{
          overflow-y: auto;
          height: calc(100% - 30px);
          margin: 0;
          padding: 0;
          list-style-type: none;
        }
        li{
          height: 30px;
          color: #595959;
          line-height: 20px;
          padding: 5px 15px;
          border-bottom: 1px solid #E6E6E6;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          display: list-item;
        }
        div.title{
          padding: 5px 15px;
          color: #595959;
          font-weight: bold;
          display: inline-block;
          width: calc(100% - 35px);
        }
        /* icons */
        .icon{
          font-size: 8px;
          font-style: italic;
        }
        .clear_selections{
          display: inline-block;
          font-family: LUI icons;
          font-size: 16px;
          font-weight: 400;
          font-style: normal;
          text-decoration: inherit;
          text-transform: none;
          direction: ltr;
        }
        input{
          min-width: 0;
          border: none;
          background: transparent;
          color: inherit;
          font-size: 13px;
          outline: 0;
          flex: 1 1 auto;
          box-shadow: none;
          border-radius: 0;
          padding: 0;
          height: 38px;
          box-sizing: border-box;
        }
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
