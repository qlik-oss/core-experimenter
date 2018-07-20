import { LitElement, html } from '../../node_modules/lit-html-element/lit-element';

class ListBox extends LitElement {
  render() {
    return html`
      <div>
        This is my list box
      </div>
    `;
  }
}
customElements.define('list-box', ListBox);
