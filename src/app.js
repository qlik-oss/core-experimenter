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

const rangeColor = ['#64bbe3', '#ffcc00', '#ff7300', '#20cfbd'];

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

function hoverIn(d) {
  const b = document.getElementById('one');
  b.highlight(d);


  const lbs = document.getElementsByTagName('list-box');
  var currListbox;
  for (let i = 0; i < lbs.length; i++) {
    if (lbs[i].titleValue === d.field) {
      currListbox = lbs[i];
    } else {
      lbs[i].style.opacity = 0.4;
    }
  }
  if (currListbox) {
    currListbox.style.opacity = 1;
  }
  const listboxWidth = document.getElementsByTagName('list-box')[0].offsetWidth;
  document.getElementsByClassName('listbox_cnt')[0].style.left =
    'calc(calc(calc(100% - ' + listboxWidth + 'px)/ ' + fields.length + ') -' +
    ' calc(' + listboxWidth + 'px*' + fields.indexOf(d.field) + '))';
}

function hoverOut(d) {
  const b = document.getElementById('one');
  b.lowlight(d);
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
      colorBy: colors.domain(fields).range(rangeColor),
      clickCallback: select,
      mouseOver: hoverIn,
      mouseOut: hoverOut,
    };
  }

  function updateAppbar() {
    const appbar = document.getElementsByTagName('app-bar')[0];
    appbar.data = {
      clearCallback: curApp.clearAll.bind(curApp),
      backCallback: curApp.back.bind(curApp),
      forwardCallback: curApp.forward.bind(curApp),
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
        colorBy: colors.domain(fields).range(rangeColor),
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
    d.fillColor = colors.domain(fields).range(rangeColor);
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
    curApp.mdk = model;
    const update = () => object.getLayout().then((layout) => {
      const d = document.getElementById(elId);
      d.data = layout.qHyperCube.qDataPages[0].qMatrix;
    });

    object.on('changed', update);
    const d = document.getElementById(elId);
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
  document.createElement('appbar');
  createKpi(app, 'num(count(distinct title)/count(total title)*100, "#,##")', 'titles', 'kp1');
  createKpi(app, 'num(count(distinct release)/count(total release)*100, "#,##")', 'releases', 'kp2');
  createKpi(app, 'num(count(distinct year)/count(total year)*100, "#,##")', 'years', 'kp3');
  createKpi(app, 'num(count(distinct artist_name)/count(total artist_name)*100, "#,##")', 'artists', 'kp4');
  setTimeout(() => {
    resize();
  }, 1000);
}

window.onresize = (resize);
init();
console.log('app running');
