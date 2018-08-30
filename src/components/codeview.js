import highlight from 'highlight.js';

import { render, html } from '../../node_modules/lit-html/lib/lit-extended';
import css from './codeview.css';
import highlightCss from '../../node_modules/highlight.js/styles/agate.css';


class CodeView extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  invalidate() {
    if (!this.needsRender) {
      this.needsRender = true;
      return Promise.resolve().then(() => {
        this.needsRender = false;
        render(this.template(), this.root);
        this.root.querySelectorAll('pre code').forEach((block) => {
          highlight.highlightBlock(block);
        });
        return true;
      });
    }
    return Promise.resolve(true);
  }

  // from https://stackoverflow.com/questions/17733076/smooth-scroll-anchor-links-without-jquery
  _scrollTo(element, to, duration) {
    if (duration <= 0) return;
    const difference = to - element.scrollTop;
    const perTick = difference / duration * 10;

    setTimeout(() => {
      element.scrollTop += perTick;
      if (element.scrollTop === to) return;
      this._scrollTo(element, to, duration - 10);
    }, 10);
  }

  connectedCallback() {
    this.invalidate().then(() => {
      this.root.addEventListener('click', this._handleClick.bind(this));
    });
  }

  _handleClick(event) {
    if (event.target.nodeName === 'A') {
      const target = event.target.getAttribute('href');
      const offsetTarget = this.root.querySelector(target).offsetTop;
      this._scrollTo(this.root.querySelector('.scroller'), offsetTarget, 600);
    }
  }

  template() {
    /* eslint-disable */
    return html`
        <style>
        ${css}
        ${highlightCss}
        </style>
        <div>
          <nav class="navigation" id="mainNav">
            <a class="navigation__link" href="#sect1">Get Data</a>
            <a class="navigation__link" href="#sect2">Select Data</a>
            <a class="navigation__link" href="#sect3">Filter Data</a>
            <a class="navigation__link" href="#sect4">Getting the field values states</a>
            <a class="navigation__link" href="#sect5">Defining a calculation</a>
          </nav>
          <section>
            <div class="scroller">
              <div class="page-section hero" id="sect1">
                <h1>Get data from engine</h1>
                <p>
                  Create objects describing what data you want like field and or calculation.
                  Those objects will give you updated information when states changes.
                  You simply need to provide a callback.
                  Here's an object to get filtered information, only giving selected and associated data.
                </p>
                <pre>
<code class="lang-javascript">
const myHyperCube = {
  ...
  qHyperCubeDef: {
        qDimensions: [{
          qDef: { qFieldDefs: ['Song'] }                  //   _____________________________________________
        },{                                               //   | Song     | Album     | Artist    | Total |
          qDef: { qFieldDefs: ['Album'] }                 //   ---------------------------------------------
        },{                                               //   | song1  s | album1  s | artist2 s | 10    |
          qDef: { qFieldDefs: ['Artist'] }                //   | song2  s | album1  s | artist2 s | 30    |
        }],                                               //   | song2  s | album1  s | artist2 s | 11    |
        qMeasures: [{                                     //   | song4  s | album1  s | artist2 s | 12    |
            qDef: {
              qDef: &#x60=COUNT (DISTINCT Album)&#x60,
              qLabel: 'Total',
            },
            qSortBy: {
              qSortByNumeric: -1,
            },
          },
        ],
        qInitialDataFetch: [{
          qTop: 0, qHeight: 20, qLeft: 0, qWidth: 17,
        }],
        qSuppressZero: false,
        qSuppressMissing: true,
      },
    ...
};
app.createSessionObject(myHyperCube).then((model) => {
  model.getLayout().then(layout => {
    layout.qHyperCube.qDataPages[0].forEach(row=>{
      // play with your data
    });
  });
});
</code>
                </pre>
              </div>
              <div class="page-section" id="sect2">
                    <h1>Select Data</h1>
                    <p>Here's how you can apply selection on fields, easy !</p>
                    <pre>
<code class="lang-javascript">
...
app.selectAssociations(0,                               //   --------------------------------------------
    ['Mustang'],                                        //   | Ford     | Mustang F... | 22 540   | ... |
    { qSearchFields:  ['Model'] });                     //   | song1  s | Mustang GT   | 29 053   | ... |
...
object.on('changed', () = {
  object.getLayout(layout=>{
    // data
  });
});
...
</code>
                    </pre>
              </div>
              <div class="page-section" id="sect3">
                    <h1>Filter Data</h1>
                    <p>Another way to do selections.
                    Based on this selection, remember the engine will automatically update everything for you !
                    </p>
                    <pre>
<code class="lang-javascript">
...
app.getField('Year').then(field => {
  field.selectValues([{                                 //     ^        .---.
    qText: '2010', 'qIsNumeric': false                  //     |       .     .
  },{                                                   //     |      .       .
    qText: '2011', 'qIsNumeric': false                  //    -|.....:....................
  }], true).then(()=>{                                  //     |    .:          .
    layout.qHyperCube.qDataPages[0].forEach(row=>{      //     |   . :           .         .-.
      // filtered                                       //     |  .  :            .       .   .
    });                                                 //     | .   :             .     .     .
  });                                                   //    -|.....:..............:..................
});                                                     //     |     :              : -           --
...                                                     //     -------------+-----+--------------+----->
</code>
                    </pre>
              </div>
              <div class="page-section" id="sect4">
                    <h1>Getting field values states</h1>
                    <p>All you have to do is to send the field name to the Qlik Core engine and listen for changes, for example when a selection happens (See previous section).</p>
                    <pre>
<code class="lang-javascript">
const properties = {
  ...
  qListObjectDef: {                                       //   __________________
    qDef: {                                               //   | THE_FIELD_NAME |
      qFieldDefs: ["THE_FIELD_NAME"],                     //   ------------------
    },                                                    //   | value1       s |
    ...                                                   //   | value2       o |
};                                                        //   | value3       o |
app.createSessionObject(properties).then((object) => {    //   | value4       a |
  //will be triggered when needed
  const update = () => object.getLayout().then((layout) => {
    //do something with the values,
  });
  object.on('changed', update);
  update();
});
</code>
                    </pre>
              </div>
              <div class="page-section" id="sect5">
                <h1>Defining a calculation</h1>
                <p>Very similar to the above but this time we describe a calculation, not field. Engine will automatically update the calculation when the states change.</p>
                <pre>
<code class="lang-javascript">
const properties = {
  ...
  qHyperCubeDef: {
    qDimensions: [],
    qMeasures: [
      {
        qDef: {                                           //       *  *              *  *
          qDef: "=COUNT (DISTINCT Artist)",               //    *        *        *        *
        },                                                //   *    12%   *      *   100%   *
      },                                                  //   *          *      *          *
    ],                                                    //    *        *        *        *
    qInitialDataFetch: [{                                 //       *  *              *  *
      qTop: 0, qHeight: 1, qLeft: 0, qWidth: 1,           //
    }]                                                    //       =COUNT (DISTINCT Artist)
  },
  ...
  },
};
app.createSessionObject(properties).then((object) => {
  //will be triggered when needed
  const update = () => object.getLayout().then((layout) => {
    //do something with the expression result,
  });
  object.on('changed', update);
  update();
});
</code>
                </pre>
              </div>
            </div>
          </section>
        <div>
      `;
    /* eslint-enable */
  }
}

customElements.define('cpp-codeview', CodeView);
