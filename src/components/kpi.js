
import { render, html } from '../../node_modules/lit-html/lib/lit-extended';

class KPI extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.dt = null;
    this._title = 'No title';
    this.formula = '';
    this._error = null;
    this.data = null;
    this.inputChangeDelegate = () => {};
  }

  connectedCallback() {
  }

  _frm(e) {
    console.log(e.value);
    this.inputChangeDelegate(e.value);
  }

  get data() {
    if (this.dt != null && this.dt[0] && this.dt[0][0].qText) {
      return this.dt[0][0].qText;
    }
    return 'empty';
  }

  set data(val) {
    this.dt = val;
    this.invalidate();
  }

  get title() {
    return this._title;
  }

  set title(val) {
    this._title = val;
    // this.invalidate();
  }

  get formula() {
    return this._formula;
  }

  set formula(val) {
    this._formula = val;
    // this.invalidate();
  }

  get error() {
    return this._formula;
  }

  set error(val) {
    this._error = val;
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

  template() {
    /* eslint-disable */
    return html`
    <div>
      <h2>${this.title}</h2>
      <input style="width:98%" on-change="${(e) => { this._frm(e.target); }}" value="${this.formula}"></input><br>
      <slot style="width:98%" name="title">${this.data}</slot><br>
      <slot style="width:98%;color:red" name="error">${this._error}</slot>
    </div>
    `;
    /* eslint-enable */
  }
}
customElements.define('kpi-comp', KPI);
