
import { render, html } from '../../node_modules/lit-html/lib/lit-extended';
import { repeat } from '../../node_modules/lit-html/lib/repeat';
import css from './table.css';
import utils from '../utils/utils';

class CpTable extends HTMLElement {
  constructor() {
    super();
    this.headerValues = [];
    this.dataValue = {};
    this.colorBy = null;
    this.clickCallback = null;
    this.mouseOver = null;
    this.mouseOut = null;
    this.filterQuery = '';
    this.root = this.attachShadow({ mode: 'open' });
  }

  get data() {
    return this.dataValue;
  }

  set data(val) {
    this.headerValues = val.headers;
    this.dataValue = val.items;
    this.colorBy = val.colorBy || function () { return 'white'; };
    this.mouseOver = this.mouseOver || val.mouseOver;
    this.mouseOut = this.mouseOut || val.mouseOut;
    this.clickCallback = this.clickCallback || val.clickCallback;
    this.clearCallback = this.clearCallback || val.clearCallback;
    this.backCallback = this.backCallback || val.backCallback;
    this.forwardCallback = this.forwardCallback || val.forwardCallback;
    this.invalidate();
  }

  _clickCallback(param) {
    this.clickCallback(param);
  }

  _mouseOver(param) {
    this.mouseOver(param);
  }

  _mouseOut(param) {
    this.mouseOut(param);
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

  template() {
    /* eslint-disable */
    return html`
      <style>
        ${css}
      </style>
      <div class="cp-table">
        <table>
          <thead>
            <tr class="header">
            ${repeat(this.headerValues, header => header.toString(), header => html`<th>${header}</th>`)}
            </tr>
          </thead>
          <tbody>
          ${repeat(
            this.dataValue,
            tr => html`<tr>
              ${repeat(
                tr,
                (item, i) => html`<td style="background-color:${this.colorBy(this.headerValues[i])}" onmouseover="${(e) => { this._mouseOver({field: this.headerValues[i], id: item.qElemNumber});}}"  onmouseout="${(e) => { this._mouseOut({field: this.headerValues[i], id: item.qElemNumber});}}" class$="${item.qState}" on-click="${(e) => { this._clickCallback({field: this.headerValues[i], id: item.qElemNumber});}}">${item.qText}<span class="state" title="${utils.states[item.qState]}">(${item.qState})</span></td>`
              )}
            </tr>`
          )}
          </tbody>
        </table>
      </div>
    `;
    /* eslint-enable */
  }
}
customElements.define('cp-table', CpTable);
