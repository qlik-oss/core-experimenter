import './components/listbox';
import './components/bubble';
import './components/kpi';
import 'enigma.js';

import schema from './assets/schema-12.20.0.json';

const schemaEnigma = JSON.parse(schema);
const nodes = [];
const listBoxes = [];
const engineHost = 'alteirac.hd.free.fr';
const enginePort = '9076';
let curApp;

async function select(d) {
  const field = await curApp.getField(d.field);
  field.lowLevelSelect([d.id], true, false);
}

async function clearFieldSelections(fieldName) {
  const field = await curApp.getField(fieldName);
  return field.clear();
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

function resize() {
  const d = document.getElementsByTagName('bubble-chart')[0];
  d.resize(nodes);
}

function createMyList(app, field) {
  const properties = {
    qInfo: {
      qType: 'lb',
      id: 'riderList',
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
  app.createSessionObject(properties).then((model) => {
    const object = model;

    const updateBubbles = layout => new Promise((resolve/* , reject */) => {
      const mx = Math.max(nodes.length, layout.qListObject.qDataPages[0].qMatrix.length);
      const d = document.getElementById('one');
      const { stateCircleR, stateMapping } = d;
      const stateCArea = stateCircleR * stateCircleR * Math.PI;
      const areaPerPoint = (stateCArea / mx) * 0.9;
      const radiusPoint = Math.sqrt(areaPerPoint / Math.PI);
      layout.qListObject.qDataPages[0].qMatrix.map((e) => {
        [e] = e;
        let found = false;
        nodes.map((el) => {
          if (el.id === e.qElemNumber && el.field === field) {
            el.state = stateMapping[e.qState];
            el.radius = radiusPoint;
            found = true;
          }
          return found;
        });
        if (!found) {
          nodes.push({
            id: e.qElemNumber,
            radius: radiusPoint,
            field,
            value: e.qText,
            state: stateMapping[e.qState],
            x: Math.random() * 900,
            y: Math.random() * 800,
          });
        }
        return found;
      });

      d.radiusPoint = radiusPoint;
      d.selectDelegate = select;
      d.data = nodes;
      resolve();
    });

    const updateListBoxes = (layout) => {
      function _createAndAppendListbox() {
        const listbox = {
          id: layout.qInfo.qId,
          element: document.createElement('list-box'),
        };
        document.getElementsByClassName('footer')[0].appendChild(listbox.element);
        resize();
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
    update();
  });
}

function patchIt(val) {
  const patches = [{
    qPath: '/qHyperCubeDef/qMeasures/0/qDef/qDef',
    qOp: 'replace',
    qValue: `"=${val}"`,
  }];
  curApp.md.applyPatches(patches, false);
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
  // const app = await connectEngine('music.qvf');
  // await createMyList(app, 'title');
  // await createMyList(app, 'artist_name');
  // await createMyList(app, 'year');
  // await createMyList(app, 'release');
  // createKpi(app, 'count([title])', '# of title');
  const app = await connectEngine('fruit.qvf');
  await createMyList(app, 'name');
  await createMyList(app, 'color');
  await createMyList(app, 'type');
  createKpi(app, 'count(distinct[name])', '# of name');
  const d = document.getElementById('one');
  d.first = false;
}

window.onresize = (resize);
init();
console.log('app running');
