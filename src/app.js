import './components/listbox';
import './components/bubble';
import './components/table';
import './components/kpi';
import * as d3 from 'd3';
import 'enigma.js';

import schema from './assets/schema-12.20.0.json';

const schemaEnigma = JSON.parse(schema);
const listBoxes = [];
let table = null;
const engineHost = 'alteirac.hd.free.fr';
const enginePort = '9076';
const colors = d3.scaleOrdinal(d3.schemeCategory10);
let curApp;

const fields = ['title', 'artist_name', 'year', 'release'];

async function select(d) {
  const field = await curApp.getField(d.field);
  field.lowLevelSelect([d.id], true, false);
}

// async function clearAllSelections() {
//   await curApp.clearAll();
// }

async function clearFieldSelections(fieldName) {
  const field = await curApp.getField(fieldName);
  return field.clear();
}

function hover(d) {
  const b = document.getElementById('one');
  b.highlight(d);
  const listboxWidth = document.getElementsByTagName('list-box')[0].offsetWidth;
  document.getElementsByClassName('listbox_cnt')[0].style.left = 'calc(calc(calc(100% - ' + listboxWidth + 'px)/ ' + fields.length + ') -' +
    ' calc(' + listboxWidth + 'px*' + fields.indexOf(d.field) + '))';
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
      colorBy: colors.domain(fields),
      clickCallback: select,
      hoverCallback: hover,
      clearCallback: curApp.clearAll.bind(curApp),
      backCallback: curApp.back.bind(curApp),
      forwardCallback: curApp.forward.bind(curApp),
    };
  }

  const update = () => object.getLayout().then((layout) => {
    updateTable(layout);
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
        qSortCriterias: [{qSortByState: 1, qSortByAscii: 1}],
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
  app.createSessionObject(properties).then((model) => {
    const object = model;

    const updateBubbles = layout => new Promise((resolve/* , reject */) => {
      const d = document.getElementById('one');
      d.update(layout, field);
      resolve();
    });

    const updateListBoxes = (layout) => {
      function _createAndAppendListbox() {
        const listbox = {
          id: layout.qInfo.qId,
          element: document.createElement('list-box'),
        };
        document.getElementsByClassName('listbox_cnt')[0].appendChild(listbox.element);
        return listbox;
      }

      listBoxes[layout.qInfo.qId] = listBoxes[layout.qInfo.qId] || _createAndAppendListbox();
      listBoxes[layout.qInfo.qId].element.data = {
        fieldName: layout.qListObject.qDimensionInfo.qFallbackTitle,
        items: layout.qListObject.qDataPages[0].qMatrix,
        clickCallback: select,
        clearCallback: clearFieldSelections,
      };
    };

    const update = () => object.getLayout().then((layout) => {
      updateBubbles(layout);
      updateListBoxes(layout);
    });
    object.on('changed', update);
    const d = document.getElementById('one');
    d.selectDelegate = select;
    d.fields = fields;
    update();
  });
}

async function createMyLists(app, fields) {
  const promiseArr = fields.map(field => createMyList(app, field, fields));
  return Promise.all(promiseArr);
}

async function patchIt(val) {
  const ck = await curApp.checkExpression(val);
  const d = document.getElementById('kp');
  d.error = '';
  ck.qBadFieldNames.map((bf) => {
    d.error = `${d.error}The field name located between the character ${bf.qFrom} and ${bf.qFrom + bf.qCount} is wrong `;
    return d.error;
  });

  d.error += ck.qErrorMsg;
  const patches = [{
    qPath: '/qHyperCubeDef/qMeasures/0/qDef/qDef',
    qOp: 'replace',
    qValue: `"=${val}"`,
  }];
  curApp.mdk.applyPatches(patches, false);
}

function createKpi(app, exp, label = 'kpi') {
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
    curApp.mdk = model;
    const update = () => object.getLayout().then((layout) => {
      const d = document.getElementById('kp');
      d.data = layout.qHyperCube.qDataPages[0].qMatrix;
    });

    object.on('changed', update);
    const d = document.getElementById('kp');
    d.title = label;
    d.formula = exp;
    d.inputChangeDelegate = patchIt;
    update();
  });
}

async function init() {
  const app = await connectEngine('music.qvf');
  // const app = await connectEngine('fruit.qvf');
  // const fields = ['name', 'color', 'type'];
  await createMyLists(app, fields);
  await createHyperCube(app, fields);
  createKpi(app, 'count(distinct title ) /count( distinct release)', 'title per release');
  setTimeout(() => {
    resize();
  }, 1000);
}

window.onresize = (resize);
init();
console.log('app running');
