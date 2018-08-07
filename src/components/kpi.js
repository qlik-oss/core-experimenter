
import { render, html } from '../../node_modules/lit-html/lib/lit-extended';
import css from '../assets/circle.css';

class KPI extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.dt = null;
    this._error = null;
    this.data = 0;
    this.inputChangeDelegate = () => { };
  }

  connectedCallback() {
  }

  get title() {
    return this.getAttribute('title') ? this.getAttribute('title') : 'no title';
  }

  set title(newValue) {
    this.setAttribute('title', newValue);
    this.invalidate();
  }

  static get observedAttributes() {
    return ['title', 'formula', 'size', 'field'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'name':
          this.title = newValue;
          break;
        case 'formula':
          this.formula = newValue;
          break;
        case 'size':
          this.size = newValue;
          break;
        case 'color':
          this.color = newValue;
          break;
        case 'field':
          this.field = newValue;
          break;
        default:
          break;
      }
      this.invalidate();
    }
  }

  _frm(el) {
    this.inputChangeDelegate(el.innerText);
  }

  get data() {
    return (this.dt != null && this.dt[0] && this.dt[0][0].qText) ? this.dt[0][0].qText : 0;
  }

  set data(val) {
    this.dt = val;
    this.invalidate();
  }

  get formula() {
    return this.getAttribute('formula') ? this.getAttribute('formula') : '';
  }

  set formula(newValue) {
    this.setAttribute('formula', newValue);
    this.invalidate();
  }

  get field() {
    return this.getAttribute('field') ? this.getAttribute('field') : '';
  }

  set field(newValue) {
    this.setAttribute('field', newValue);
    this.invalidate();
  }

  get size() {
    return this.getAttribute('size') ? this.getAttribute('size') : 'default';
  }

  set size(newValue) {
    this.setAttribute('size', newValue);
    this.invalidate();
  }

  get color() {
    return this.getAttribute('color') ? this.getAttribute('color') : 'default';
  }

  set color(newValue) {
    this.setAttribute('color', newValue);
    this.invalidate();
  }

  get theme() {
    return this.getAttribute('theme') ? this.getAttribute('theme') : 'default';
  }

  set theme(newValue) {
    this.setAttribute('theme', newValue);
    this.invalidate();
  }

  get error() {
    return this._error;
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
    <style>
      :host{
        border: 0;
        font-size: 16px;
        color: grey;
        max-width: 180px;
        text-align: center;
      }
      div[contenteditable="true"]{
        border: 0;
        border-bottom: 1px solid #e6e6e6;
        font-size: 22px;
        display: inline-block;
        max-width: 100%;
        height: 22px;
        /* text-overflow: ellipsis; */
        overflow: hidden;
        white-space: nowrap;
      }
      h2{
        margin: 10px 0px;
      }
      ${css}
    </style>
    <div>
      <h2>${this.title}</h2>
      <div class$="c100 p${parseInt(this.data)} ${this.size} ${this.theme} ${this.color} center">
          <span>${parseInt(this.data)}%</span>
          <div class="slice">
              <div class="bar"></div>
              <div class="fill"></div>
          </div>
      </div>
      <div contenteditable="true" on-input="${(e) => { this._frm(e.target); }}">${this.formula}</div>
    </div>
    `;
    /* eslint-enable */
  }
}
customElements.define('kpi-comp', KPI);
