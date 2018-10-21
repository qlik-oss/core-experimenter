import { render, html } from 'lit-html';

class Switch extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  set checked(value) {
    const isChecked = Boolean(value);
    const inputEl = this.root.querySelector('input');
    if (isChecked) {
      this.setAttribute('checked', '');
      inputEl.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
      inputEl.removeAttribute('checked');
    }
  }

  get checked() {
    return this.hasAttribute('checked') && this.getAttribute('checked') !== 'false';
  }

  _toggleChecked(e) {
    e.preventDefault();
    this.checked = !this.checked;
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        checked: this.checked,
      },
      bubbles: true,
    }));
    this.invalidate();
  }

  connectedCallback() {
    this.invalidate();
    this.addEventListener('click', this._toggleChecked);
  }

  disconnectedCallback() {
    // cleaning all eventListeners (https://stackoverflow.com/questions/19469881/remove-all-event-listeners-of-specific-type/29930689)
    const elClone = this.root.children[1].cloneNode(true);
    this.root.children[1].parentNode.replaceChild(elClone, this.root.children[1]);
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

  template() {
    /* eslint-disable */
    return html`
      <style>
        /* The switch - the box around the slider */
        .switch {
            top: 3px;
            position: relative;
            display: inline-block;
            width: 30px;
            height: 17px;
        }
        /* Hide default HTML checkbox */
        .switch input {display:none;}
        /* The slider */
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 13px;
          width: 13px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #9ba036;
        }
        input:focus + .slider {
          box-shadow: 0 0 1px #2196F3;
        }

        input:checked + .slider:before {
          transform: translateX(13px);
        }
        /* Rounded sliders */
        .slider.round {
          border-radius: 17px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
      </style>
      <label class="switch">
        <input type="checkbox">
        <span class="slider round"></span>
      </label>
    `;
    /* eslint-enable */
  }
}

customElements.define('cpp-switch', Switch);
