
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
      return Promise.resolve().then(() => {
        this.needsRender = false;
        render(this.template(), this.root);
        return true;
      });
    }
    return Promise.resolve(true);
  }

  connectedCallback() {
    this.invalidate().then(() => {
      const tableElement = this.root.querySelectorAll('table')[0];
      tableElement.addEventListener('mouseover', (e) => {
        if (e.target && e.target.nodeName === 'TD') {
          const params = {
            field: this.headerValues[e.target.getAttribute('index')],
            id: parseInt(e.target.getAttribute('data-elem'), 10),
            value: e.target.getAttribute('index'),
          };
          this._mouseOver(params);
        }
      });
      tableElement.addEventListener('mouseout', (e) => {
        if (e.target && e.target.nodeName === 'TD') {
          const params = {
            field: this.headerValues[e.target.getAttribute('index')],
            id: parseInt(e.target.getAttribute('data-elem'), 10),
            value: e.target.getAttribute('index'),
          };
          this._mouseOut(params);
        }
      });
      tableElement.addEventListener('click', (e) => {
        if (e.target && e.target.nodeName === 'TD') {
          const params = {
            field: this.headerValues[e.target.getAttribute('index')],
            id: parseInt(e.target.getAttribute('data-elem'), 10),
          };
          this._clickCallback(params);
        }
      });
    });
  }

  disconnectedCallback() {
    // cleaning all eventListeners (https://stackoverflow.com/questions/19469881/remove-all-event-listeners-of-specific-type/29930689)
    const tableElement = this.root.querySelectorAll('table')[0];
    const elClone = tableElement.cloneNode(true);
    tableElement.parentNode.replaceChild(elClone, tableElement);
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
            ${repeat(this.headerValues, header => header.toString(), header => html`<th style="border-left: 2px solid ${this.colorBy(header)};">${header}</th>`)}
            </tr>
          </thead>
          <tbody>
          ${repeat(this.dataValue, tr => html`<tr>
            ${repeat(tr, (item, i) => html`<td 
                        style="background-color:${this.colorBy(this.headerValues[i])};"
                        index$="${i}"
                        data-text$="${item.qText}"
                        data-elem$="${item.qElemNumber}"
                        class$="${item.qState}" >
                          ${item.qText}
                          <span class="state" title="${utils.states[item.qState]}">(${item.qState})</span>
                        </td>`
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
