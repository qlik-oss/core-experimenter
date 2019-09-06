import { render, html } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';

import css from './listbox.css';
import utils from '../utils/utils';

class ListBox extends HTMLElement {
  constructor() {
    super();
    this.titleValue = '';
    this.dataValue = {};
    this.filterQuery = '';
    this.events = {
      clearCallback: null,
      clickCallback: null,
      mouseOverCallback: null,
      mouseOutCallback: null,
    };
    this.onmouseleave = (e) => this._mouseLeftListbox(e);
    this.onmouseenter = (e) => this._mouseEnteredListbox(e);
    this.colorBy = null;
    this.myTimeout = null;
    this.root = this.attachShadow({ mode: 'open' });
  }

  get data() {
    return this.dataValue;
  }

  set data(val) {
    // ToDo: implement validation
    this.titleValue = val.fieldName;
    this.dataValue = val.items;
    this.events = {
      clearCallback: this.events.clearCallback || val.clearCallback,
      clickCallback: this.events.clickCallback || val.clickCallback,
      mouseOverCallback: this.events.mouseOverCallback || val.mouseOver,
      mouseOutCallback: this.events.mouseOutCallback || val.mouseOut,
    };
    this.colorBy = val.colorBy;
    this.invalidate();
  }

  _mouseEnteredListbox() {
    this.awaitSetInFocus(500);
  }

  _mouseLeftListbox() {
    this.cancelSetInFocus();
  }

  cancelSetInFocus() {
    if (this.myTimeout) {
      clearTimeout(this.myTimeout);
    }
  }

  awaitSetInFocus(delay) {
    this.myTimeout = setTimeout(() => {
      const lbs = document.getElementsByTagName('list-box');
      let curIndex;
      for (let i = 0; i < lbs.length; i++) {
        if (lbs[i].titleValue === this.titleValue) {
          curIndex = i;
          this.style.opacity = 1;
        } else {
          lbs[i].style.opacity = 0.4;
        }
      }

      const listboxWidth = document.getElementsByTagName('list-box')[0].offsetWidth + 20;
      const newLeft = listboxWidth * -1 * curIndex;
      const extraPadding = curIndex === 0 ? 0 : 40;
      document.getElementsByClassName('listbox_cnt')[0].style.left = `${newLeft + extraPadding}px`;
    }, delay);
  }

  _mouseOverList(elNumber) {
    const param = {
      field: this.titleValue,
      id: parseInt(elNumber, 10),
      source: 'listBox',
    };
    this.events.mouseOverCallback(param);
  }

  _mouseOutList(elNumber) {
    const param = {
      field: this.titleValue,
      id: parseInt(elNumber, 10),
      source: 'listBox',
    };
    this.events.mouseOutCallback(param);
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

  _clickCallback(qElemNumber) {
    this.events.clickCallback({
      field: this.titleValue,
      id: parseInt(qElemNumber, 10),
    });
  }

  _clearCallback() {
    this.events.clearCallback(this.titleValue);
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
      const ulElement = this.root.querySelectorAll('ul')[0];
      ulElement.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target) {
          const elNumber = e.target.hasAttribute('data-elem') ? e.target.getAttribute('data-elem') : e.target.parentElement.getAttribute('data-elem');
          this._clickCallback(elNumber);
        }
      });

      ulElement.addEventListener('mouseover', (e) => {
        e.stopPropagation();
        if (e.target) {
          const elNumber = e.target.hasAttribute('data-elem') ? e.target.getAttribute('data-elem') : e.target.parentElement.getAttribute('data-elem');
          this._mouseOverList(elNumber);
        }
      });

      ulElement.addEventListener('mouseout', (e) => {
        e.stopPropagation();
        if (e.target) {
          const elNumber = e.target.hasAttribute('data-elem') ? e.target.getAttribute('data-elem') : e.target.parentElement.getAttribute('data-elem');
          this._mouseOutList(elNumber);
        }
      });
    });
  }

  disconnectedCallback() {
    // cleaning all eventListeners (https://stackoverflow.com/questions/19469881/remove-all-event-listeners-of-specific-type/29930689)
    const ulElement = this.root.querySelectorAll('ul')[0];
    const elClone = ulElement.cloneNode(true);
    ulElement.parentNode.replaceChild(elClone, ulElement);
  }

  template() {
    /* eslint-disable */
    return html`
      <style>
        ${css}
        .list-box {height: calc(100% - 70px)}
        li {background-color:${this.colorBy(this.titleValue)};}
      </style>
      <div class="list-box">
        <div class="header" style="background-color:${this.colorBy(this.titleValue)};" >
          <div class="title" style="color:white">
            ${this.titleValue}<div class="icon clear_selections" @click="${() => { this._clearCallback(); }}">clear</div>
          </div>
          <div class="filter"  style="background-color:white">
            <div class="icon search">&#x26B2;</div>
            <input class="search_input" maxlength="255" placeholder="Filter" spellcheck="false" type="text" @keyup="${(e) => { this._searchFilter(e.target); }}"/>
            <div class="icon cancel" @click="${() => { this._cancelFilter(); }}">x</div>
          </div>
        </div>
        <ul>
          ${repeat(Object.keys(this.data).filter(key => this.data[key][0].qText.toLowerCase().indexOf(this.filterQuery.toLowerCase()) !== -1), key => this.data[key][0].qText, (key) => {
        return html`<li
                  title="${this.data[key][0].qText}"
                  data-elem="${this.data[key][0].qElemNumber}"
                  class="${this.data[key][0].qState}">
                    <span class="state" title="${utils.states[this.data[key][0].qState]}">${this.data[key][0].qState}</span>
                    <div class="titleText">${this.data[key][0].qText} </div>
                  </li>`;
      })}
        </ul>
      </div>
    `;
    /* eslint-enable */
  }
}

customElements.define('list-box', ListBox);
