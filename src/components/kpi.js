
import { render, html } from '../../node_modules/lit-html/lib/lit-extended';

class KPI extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.dt = null;
    this._title = 'No title';
    this.data = null;
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
      <slot name="title">${this.data}</slot>
    </div>
    `;
    /* eslint-enable */
  }
}
customElements.define('kpi-comp', KPI);
