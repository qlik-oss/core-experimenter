import './components/listbox';
import './components/bubble';
import './components/table';
import './components/kpi';
import './components/appbar';
import * as d3 from 'd3';
import 'enigma.js';

import schema from './assets/schema-12.20.0.json';

const schemaEnigma = JSON.parse(schema);
const listBoxes = [];
let table = null;
const engineHost = 'alteirac.hd.free.fr';
const enginePort = '9076';
const colors = d3.scaleOrdinal();
const dataSources = ['music', 'fruit', 'car'];
const _this = this;

const rangeColor = ['#64bbe3', '#ffcc00', '#ff7300', '#20cfbd'];
let tableOrder = [];
let currentListBoxes = [];
let curApp;


async function select(d) {
  const field = await curApp.getField(d.field);
  field.lowLevelSelect([d.id], true, false);
}

async function clearFieldSelections(fieldName) {
  const field = await curApp.getField(fieldName);
  return field.clear();
}

function setUpListboxScroll() {
  const scrollArea = document.getElementsByClassName('scrollArea')[0];
  scrollArea.addEventListener('mouseenter', () => {
    scrollArea.style.opacity = 1;
    _this.scrollTimeout = setInterval(() => {
      const container = document.getElementsByClassName('listbox_cnt')[0];
      const distance = 270;
      const leftDist = container.style.left;
      const newLeft = parseInt(leftDist.substring(0, leftDist.length - 2), 10) + distance;
      if (newLeft < 0) {
        document.getElementsByClassName('listbox_cnt')[0].style.left = `${newLeft}px`;
      } else {
        document.getElementsByClassName('listbox_cnt')[0].style.left = '20px';
        setTimeout(() => {
          document.getElementsByClassName('listbox_cnt')[0].style.left = '00px';
        }, 100);
      }
    }, 500);
  }, true);
  scrollArea.addEventListener('mouseleave', () => {
    scrollArea.style.opacity = 0.5;
    if (_this.scrollTimeout) {
      clearInterval(_this.scrollTimeout);
    }
  }, true);
}

function _getListboxObjects(d) {
  const lbs = document.getElementsByTagName('list-box');
  let currListBox;
  for (let i = 0; i < lbs.length; i++) {
    if (lbs[i].titleValue === d.field) {
      currListBox = lbs[i];
    }
  }
  const lis = currListBox.shadowRoot.childNodes[3].getElementsByTagName('ul')[0].getElementsByTagName('li');
  let i = 0;
  let found = false;
  let res;
  while (i < lis.length && !found) {
    if (lis[i].title === d.value) {
      found = true;
      res = lis[i];
    }
    i += 1;
  }
  return { listObject: res, listBox: currListBox };
}

function lowLightListBox(d) {
  const res = _getListboxObjects(d);
  if (res.listObject) {
    res.listObject.style.background = 'transparent';
    res.listObject.style.color = '#595959';
  }
}

function highlightListBox(d) {
  const res = _getListboxObjects(d);
  if (res.listObject) {
    res.listObject.parentNode.scrollTop = res.listObject.offsetTop
      - res.listObject.parentNode.offsetTop;
    res.listObject.style.background = d3.rgb(colors(d.field)).darker();
    res.listObject.style.color = '#fff';
  }
}

function hoverIn(d) {
  const b = document.getElementById('one');
  b.highlight(d);
  highlightListBox(d);

  let currListBox = null;
  const lbs = document.getElementsByTagName('list-box');
  for (let i = 0; i < lbs.length; i++) {
    if (lbs[i].titleValue === d.field) {
      currListBox = lbs[i];
    }
  }
  if (d.source !== 'listBox') {
    currListBox.awaitSetInFocus(0);
  }

}

function hoverOut(d) {
  const b = document.getElementById('one');
  b.lowlight(d);
  lowLightListBox(d);
}

async function connectEngine(appName) {
  const session = enigma.create({
    schema: schemaEnigma,
    url: `ws://${engineHost}:${enginePort}/app/identity/${new Date()}`,
    createSocket: url => new WebSocket(url),
    responseInterceptors: [{
      onRejected: async function retryAbortedError(/* sessionReference, request, error */) {
        console.warn('retryAborted callback ?');
      },
    }],
  });
  const qix = await session.open();
  const app = await qix.openDoc(appName);
  curApp = app;
  return app;
}

function clear() {
  curApp.clearAll();
}

function back() {
  curApp.back();
}

function forward() {
  curApp.forward();
}

function createHyperCube(app, fields) {
  let object;

  function _fieldsToqDef(flds) {
    return flds.map(field => ({
      qDef: {
        qFieldDefs: [field],
      },
    }));
  }

  const properties = {
    qInfo: {
      qType: 'table',
      qId: 'table_id',
    },
    labels: true,
    qHyperCubeDef: {
      qDimensions: _fieldsToqDef(fields),
      qInitialDataFetch: [{
        qTop: 0, qHeight: 100, qLeft: 0, qWidth: 100,
      }],
      qSuppressZero: false,
      qSuppressMissing: true,
    },
  };

  function updateTable(layout) {
    function _createTable() {
      const tableEl = document.createElement('cp-table');
      document.getElementsByClassName('table')[0].appendChild(tableEl);
      return tableEl;
    }

    table = table || _createTable();
    table.data = {
      headers: layout.qHyperCube.qDimensionInfo.map(dim => dim.qFallbackTitle),
      items: layout.qHyperCube.qDataPages[0].qMatrix,
      colorBy: colors.domain(fields).range(rangeColor),
      clickCallback: select,
      mouseOver: hoverIn,
      mouseOut: hoverOut,
    };
  }

  function updateAppbar() {
    const appbar = document.getElementsByTagName('app-bar')[0];
    appbar.data = {
      ds: dataSources,
      // eslint-disable-next-line no-use-before-define
      dsChange: newDS,
      clearCallback: clear,
      backCallback: back,
      forwardCallback: forward,
    };
  }

  const update = () => object.getLayout().then((layout) => {
    updateTable(layout);
    updateAppbar();
  });

  return app.createSessionObject(properties).then((model) => {
    object = model;
    model.on('changed', update);
    update();
  });
}

function resize() {
  const d = document.getElementsByTagName('bubble-chart')[0];
  d.resize();
}

function createMyList(app, field, fields) {
  const properties = {
    qInfo: {
      qType: 'lb',
      id: 'flist',
    },
    qListObjectDef: {
      qDef: {
        qFieldDefs: [field],
        qSortCriterias: [{ qSortByState: 1, qSortByAscii: 1 }],
      },
      qShowAlternatives: true,
      qInitialDataFetch: [{
        qTop: 0,
        qHeight: 500,
        qLeft: 0,
        qWidth: 1,
      }],
    },
  };
  tableOrder.push(properties.qListObjectDef.qDef.qFieldDefs[0]);
  currentListBoxes = [];
  app.createSessionObject(properties).then((model) => {
    const object = model;
    const updateBubbles = layout => new Promise((resolve/* , reject */) => {
      const d = document.getElementById('one');
      d.update(layout, field, fields);
      resolve();
    });
    const updateListBoxes = (layout) => {
      function _createAndAppendListbox(_fieldName) {
        const listbox = {
          id: layout.qInfo.qId,
          fieldName: _fieldName,
          element: document.createElement('list-box'),
        };
        return listbox;
      }
      const _fieldName = layout.qListObject.qDimensionInfo.qFallbackTitle;
      listBoxes[layout.qInfo.qId] = listBoxes[layout.qInfo.qId]
        || _createAndAppendListbox(_fieldName);
      listBoxes[layout.qInfo.qId].element.data = {
        fieldName: _fieldName,
        items: layout.qListObject.qDataPages[0].qMatrix,
        clickCallback: select,
        clearCallback: clearFieldSelections,
        mouseOver: hoverIn,
        mouseOut: hoverOut,
        colorBy: colors.domain(fields).range(rangeColor),
      };
      currentListBoxes.push(listBoxes[layout.qInfo.qId]);

      if (currentListBoxes.length === tableOrder.length) {
        const container = document.getElementsByClassName('listbox_cnt')[0];
        for (let i = 0; i < tableOrder.length; i++) {
          for (let j = 0; j < currentListBoxes.length; j++) {
            if (tableOrder[i] === currentListBoxes[j].fieldName) {
              container.append(currentListBoxes[j].element);
            }
          }
        }
      }
    };

    const update = () => object.getLayout().then((layout) => {
      updateBubbles(layout);
      updateListBoxes(layout);
    });
    object.on('changed', update);
    const d = document.getElementById('one');
    d.selectDelegate = select;
    d.fields = fields;
    d.fillColor = colors.domain(fields).range(rangeColor);
    update();
  });
}

async function createMyLists(app, fields) {
  const promiseArr = fields.map(field => createMyList(app, field, fields));
  return Promise.all(promiseArr);
}

async function patchIt(val, id) {
  const ck = await curApp.checkExpression(val);
  const d = document.getElementById(id);
  d.error = '';
  ck.qBadFieldNames.map((bf) => {
    d.error = `${d.error}The field name located between the character ${bf.qFrom} and ${bf.qFrom + bf.qCount} is wrong `;
    return d.error;
  });

  d.error += ck.qErrorMsg;
  if (d.error === '') {
    const patches = [{
      qPath: '/qHyperCubeDef/qMeasures/0/qDef/qDef',
      qOp: 'replace',
      qValue: `"=${val}"`,
    }];
    d.model.applyPatches(patches, false);
  }
}

function createKpi(app, exp, label = 'kpi', elId) {
  const props = {
    qInfo: {
      qType: 'kpi',
      qId: 'yes:-)',
    },
    type: 'my-kpi',
    labels: true,
    qHyperCubeDef: {
      qDimensions: [],
      qMeasures: [
        {
          qDef: {
            qDef: `=${exp}`,
            qLabel: label,
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
  };
  app.createSessionObject(props).then((model) => {
    const object = model;
    const update = () => object.getLayout().then((layout) => {
      const d = document.getElementById(elId);
      if (d) { d.data = layout.qHyperCube.qDataPages[0].qMatrix; }
    });

    object.on('changed', update);
    const d = document.getElementById(elId);
    if (d) {
      d.model = model;
      d.title = label;
      d.formula = exp;
      d.inputChangeDelegate = patchIt;
    }
    update();
  });
}

async function newDS(e) {
  let titleFields = [];
  tableOrder = [];
  document.getElementsByClassName('listbox_cnt')[0].innerHTML = '';
  document.getElementById('one').data = [];
  const properties = {
    qInfo: {
      qType: 'flist',
    },
    qFieldListDef: {},
  };
  const app = await connectEngine(`${e}.qvf`);
  const obj = await app.createObject(properties);
  const lay = await obj.getLayout();
  titleFields = lay.qFieldList.qItems.map(f => f.qName);
  curApp = app;
  await createMyLists(app, titleFields);
  await createHyperCube(app, titleFields);
  titleFields.forEach((en, i) => {
    createKpi(app, `count(distinct ${en})/count(distinct {1} ${en})*100`, en, `kp${i + 1}`);
  });
}

async function init() {
  newDS('music');
  setUpListboxScroll();
}

window.onresize = (resize);
init();
console.log('app running');
