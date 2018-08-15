import {render, html} from '../../node_modules/lit-html/lib/lit-extended';
import cssCircle from '../assets/circle.css';
import cssKPI from './kpi.css';

class KPI extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({mode: 'open'});
    this.dt = null;
    this._error = null;
    this.data = 0;
    this.inputChangeDelegate = () => {
    };
    this.unformatedText = null;
    this.formatedText = null;
    this.allFields = [];
    this.colorBy = null;
    this.firstRender = false;
  }

  connectedCallback() {
    this.invalidate();
  }

  get title() {
    return this.getAttribute('title') ? this.getAttribute('title') : 'no title';
  }

  set title(newValue) {
    this.setAttribute('title', newValue);
    this.invalidate();
  }

  static get observedAttributes() {
    return ['title', 'formula', 'size', 'field', 'color'];
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
    this.inputChangeDelegate(this.unformatedText ? this.unformatedText : el.innerHTML, this.id);
  }

  get data() {
    return (this.dt != null && this.dt[0] && this.dt[0][0].qNum) ? this.dt[0][0].qNum : 0;
  }

  set data(val) {
    this.dt = val;
    this.invalidate();
  }

  get formula() {
    return this.getAttribute('formula') ? this.getAttribute('formula') : '';
  }

  getHighlightedFormula() {
    return this._highlight();
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
        const expressionElement = this.root.querySelectorAll('div[contenteditable]')[0];
        this._highlight(expressionElement);
      });
    }
  }

  _getFieldColor(field) {
    return this.colorBy(field);
  }

  _highlight(e) {
    this.unformatedText = e.innerHTML;
    this.allFields.forEach((field) => {
      e.innerHTML = e.innerHTML.split(field).join(`<span class="field${this.allFields.indexOf(field)}" style="color:${this._getFieldColor(field)}; opacity: 0.8;
font-weight:900">${field}</span>`);
    });
  }

  _lowlight(e) {
    if (this.unformatedText) {
      e.innerHTML = this.unformatedText;
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
        font-size: 16px;
        display: inline-block;
        max-width: 180px;
        /* height: 22px; */
        /* text-overflow: ellipsis; */
        overflow: hidden;
        /*white-space: nowrap;*/
      }
      h2{
        margin: 10px 0px;
      }
      ${cssCircle}
      ${cssKPI}
    </style>
    <div>
      <h2>${this.title}</h2>
      <div class$="c100 p${parseInt(this.data)} ${this.size} ${this.theme} ${this.color} center">
          <span>${parseFloat(this.data.toFixed(2))}%</span>
          <div class="slice">
              <div class="bar"></div>
              <div class="fill"></div>
          </div>
      </div>
      <div id="hej" class="textArea" contenteditable="true" 
      on-blur="${(e) => {
      this._highlight(e.target)
    }}" 
      on-focus="${(e) => {
      this._lowlight(e.target)
    }}"
      on-input="${(e) => {
      this._frm(e.target);
    }}">${this.formula}</div>
      </div>
    `;
    /* eslint-enable */
  }
}

customElements.define('kpi-comp', KPI);
