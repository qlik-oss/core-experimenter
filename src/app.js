import './components/listbox';
import './components/bubble';
import './components/table';
import './components/kpi';
import './components/appbar';
import './components/switch';
import './components/codeview';
import * as d3 from 'd3';

import introJs from 'intro.js';
import enigma from '../node_modules/enigma.js/enigma';
// import 'intro.js/introjs.css';

import schema from './assets/schema-12.20.0.json';

const schemaEnigma = JSON.parse(schema);
const listBoxes = [];
let table = null;
const engineHost = 'process.env.NODE_ENV' === 'production' ? 'process.env.BACKEND}/app/doc' : 'localhost:9076/app/identity';
const colors = d3.scaleOrdinal();
const dataSources = ['car', 'fruit', 'music'];
const rangeColor = ['#ffd23f', '#ee414b', '#3bceac', '#3a568f', '#9a308e'];
// const cssColors = ['myBlue', 'green', 'myPurple', 'myOrange', 'myPink', 'default', 'myYellow2', 'myYellow', 'myCoralGreen', 'myPurple2', 'myCoralGreen2'];
const cssColors = ['myYellow2', 'myPink', 'myCoralGreen2', 'myBlue2'];
let tableOrder = [];
let currentListBoxes = [];
let curApp;
const _this = this;
let notInGuideMode = true;
let intro = null;


async function select(d, helpGuideOveride) {
  if (notInGuideMode || helpGuideOveride) {
    const field = await curApp.getField(d.field);
    field.lowLevelSelect([d.id], true, false);
  }
}

async function clearFieldSelections(fieldName) {
  const field = await curApp.getField(fieldName);
  return field.clear();
}

function _getListboxObjects(d) {
  const currListBox = Array.from(document.getElementsByTagName('list-box')).filter(lbx => lbx.titleValue === d.field)[0];
  if (currListBox) {
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
  return null;
}

function lowLightListBox(d) {
  const res = _getListboxObjects(d);
  if (res && res.listObject) {
    // res.listObject.style.background = d3.rgb(colors(d.field));
    // res.listObject.style.color = '#595959';
    res.listObject.style.opacity = '';
  }
}

function highlightListBox(d) {
  const res = _getListboxObjects(d);
  if (res && res.listObject) {
    res.listObject.parentNode.scrollTop = res.listObject.offsetTop - res.listObject.parentNode.offsetTop;
    // res.listObject.style.background = d3.rgb(colors(d.field)).darker();
    // res.listObject.style.color = '#fff';
    res.listObject.style.opacity = 1;
  }
}

function lightChangeKPIs(d, lightOption) {
  const kpiElements = document.getElementsByTagName('kpi-comp');
  for (let i = 0; i < kpiElements.length; i++) {
    const children = kpiElements[i].shadowRoot.childNodes;
    for (let j = 0; j < children.length; j++) {
      if (children[j].nodeName === 'DIV') {
        const currentFields = children[j].getElementsByTagName('span');
        for (let k = 0; k < currentFields.length; k++) {
          if (currentFields[k].className.indexOf(`field${tableOrder.indexOf(d.field)}`) !== -1) {
            if (lightOption === 'highlight') {
              currentFields[k].classList.add('highlightText');
              currentFields[k].style.color = d3.rgb(colors(d.field)).darker(0.5);
            } else if (lightOption === 'lowlight') {
              currentFields[k].classList.remove('highlightText');
              currentFields[k].style.color = colors.domain(tableOrder).range(rangeColor)(d.field);
            }
          }
        }
      }
    }
  }
}

function _getListbox(field) {
  let currListBox = null;
  const lbs = document.getElementsByTagName('list-box');
  for (let i = 0; i < lbs.length; i++) {
    if (lbs[i].titleValue === field) {
      currListBox = lbs[i];
    }
  }
  return currListBox;
}

function hoverIn(d) {
  const b = document.getElementById('one');
  b.highlight(d);
  highlightListBox(d);
  lightChangeKPIs(d, 'highlight');

  const currListBox = _getListbox(d.field);
  if (currListBox && d.source !== 'listBox') {
    currListBox.awaitSetInFocus(0);
  }
}

function hoverOut(d) {
  const b = document.getElementById('one');
  b.lowlight(d);
  lowLightListBox(d);
  lightChangeKPIs(d, 'lowlight');
}

async function connectEngine(appId) {
  const session = enigma.create({
    schema: schemaEnigma,
    url: `${window.location.protocol.replace('http', 'ws')}://${engineHost}/${appId}`,
    createSocket: url => new WebSocket(url),
    responseInterceptors: [{
      onRejected: async function retryAbortedError(sessionReference, request, error) {
        if (error && error.code === 15) {
          request.retry();
        } else {
          console.error(error);
        }
        return error;
      },
    }],
  });
  const qix = await session.open();
  let app;
  try {
    app = qix.openDoc(appId);
  } catch (err) {
    if (err.code === schemaEnigma.enums.LocalizedErrorCode.LOCERR_APP_ALREADY_OPEN) {
      app = qix.getActiveDoc();
    }
  }
  curApp = app;
  return app;
}

function clear(helpGuideOverride) {
  if (notInGuideMode || helpGuideOverride) {
    curApp.clearAll();
  }
}

function back(helpGuideOverride) {
  if (notInGuideMode || helpGuideOverride) {
    curApp.back();
  }
}

function forward(helpGuideOverride) {
  if (notInGuideMode || helpGuideOverride) {
    curApp.forward();
  }
}

function _helpGuideCallback() {
  if (intro) {
    switch (intro._currentStep) {
      case 0:
      case 2:
        document.getElementsByClassName('introjs-tooltip')[0].style.maxWidth = '300px';
        document.getElementsByClassName('introjs-tooltip')[0].style.minWidth = '250px';
        break;
      case 4:
        select({ id: 10, field: 'Make' }, true);
        _getListbox('Make').awaitSetInFocus(0);
        break;
      case 9:
        select({ id: 1, field: 'PriceRange' }, true);
        break;
      case 14:
        select({ id: 0, field: 'PriceRange' }, true);
        select({ id: 5, field: 'Make' }, true);
        break;
      case 15:
        back(true);
        break;
      case 16:
        forward(true);
        break;
      case 17:
        clear(true);
        break;
      case 20:
        setTimeout(() => {
          select({ id: 1, field: 'PriceRange' }, true);
          setTimeout(() => {
            select({ id: 0, field: 'PriceRange' }, true);
            setTimeout(() => {
              select({ id: 7, field: 'TopSpeed' }, true);
            }, 900);
          }, 900);
        }, 900);
        break;
      case 21:
        clear(true);
        break;
      default:

        break;
    }
  }
}

function setSize() {
  if (intro) {
    switch (intro._currentStep) {
      case 1:
        document.getElementsByClassName('introjs-tooltip')[0].style.maxWidth = '500px';
        document.getElementsByClassName('introjs-tooltip')[0].style.minWidth = '500px';
        break;
      default:
        break;
    }
  }
}

function _helpGuide() {
  // await newDS('fruit');
  const appbar = document.getElementsByTagName('app-bar')[0];
  clear();
  notInGuideMode = false;
  intro = introJs();
  intro.onexit(() => {
    notInGuideMode = true;
    clear();
  });
  intro.onafterchange(_helpGuideCallback);
  intro.onbeforechange(setSize);
  intro.setOption('tooltipPosition', 'auto');
  intro.setOption('showStepNumbers', false);
  intro.setOption('showProgress', true);
  intro.setOption('positionPrecedence', ['left', 'right', 'top', 'bottom']);
  intro.setOption('tooltipClass', 'customDefault');
  intro.setOptions({
    steps: [
      {
        intro: `Welcome to Qlik Core Experimenter!<br><br>
        Follow the guide and unleash the power !`,
      },
      {
        intro: `When dealing with data in software development,
        it's most of the time static representations with text/table or charts.<br><br>Let the user or system interacts with
        data implies specific logic to be developed.<br><br>Qlik Core will manage data interactivity for you!`,
      },
      {
        element: '#bubbles',
        intro: 'These are the bubbles with all the data points from the raw table above. Try hovering one to see information',
      },
      {
        element: '#listboxes',
        intro: 'Here are list boxes with all the data',
      },
      {
        element: '#listboxes',
        intro: `We will select <b style="color:${rangeColor[0]}">Audi</b> in the
<b class="introListbox" style="background-color:${rangeColor[0]};">Make</b> listbox`,
      },
      {
        element: '#bubbles',
        intro: `We can see that <b style="color:${rangeColor[0]}">Audi</b> is now in the <i>Selected</i> circle, and that <b
style="color:${rangeColor[0]}">other brands</b> are in the <i>alternative</i> circle.<br><br>Qlik Core automatically calculate the states.`,
      },
      {
        element: '#bubbles',
        intro: `Since <b style="color:${rangeColor[0]}">Audi</b> is selected, all the
        fields values not associated with <b style="color:${rangeColor[0]}">
        Audi</b> are in the <i>Excluded</i> circle.`,
      },
      {
        element: '#bubbles',
        intro: `And since <b style="color:${rangeColor[0]}">Audi</b> is selected, all associated values are in the <i>optional</i> circle`,
      },
      {
        element: '#bubbles',
        intro: `Now we will select a <b class="introListbox" style="background-color:${rangeColor[4]};">PriceRange</b> in
the <i>optional</i> circle.<br> All values can be selected, in any order !`,
      },
      {
        element: '#bubbles',
        intro: `Let's select the bubble with the field value <b style="color: ${rangeColor[4]}">[50 000, 100 000]</b>.`,
      },
      {
        element: '#bubbles',
        intro: `In the <i>Optional</i> circle we now see all <b style="color: ${rangeColor[0]}">Audi</b> cars with a price between $50 000 and $100 000.`,
      },
      {
        element: '#table',
        intro: 'We also see the associated cars in the table. This table is filtered on selections.',
      },
      {
        element: '#listboxes',
        intro: `And in the listbox we can see all values. The state of a field is shown to the right in the table. <span
class="nowrap"></br>S for
<i>Selected</i></span>, </br><span class="nowrap">O for <i>Optional</i></span>, </br><span class="nowrap">
X for <i>Excluded</i></span>, </br><span class="nowrap">A for <i>Alternative</i></span>, </br><span
class="nowrap">XS for <i>Excluded Selected</i></span>.`,
      },
      {
        element: '#bubbles',
        intro: `You can add additional alternatives to the selections. Let's add another  <b class="introListbox" style="background-color:${rangeColor[0]};">Make</b>
        and <b style="color: ${rangeColor[4]}">PriceRange</b>!`,
      },
      {
        element: '#bubbles',
        intro: `<b style="color: ${rangeColor[0]}">Jaguar</b> and <b style="color: ${rangeColor[4]}">[0, 50 000]]</b>has been selected!
        We now see all <b style="color: ${rangeColor[0]}">Audi</b> and <b style="color: ${rangeColor[0]}">Jaguar</b> with a
        Price lower than <b style="color: ${rangeColor[4]}">$100 000</b> in the optional circle!`,
      },
      {
        element: appbar.getElementById('backButton'),
        intro: 'You can go back one step. Click <b style="text-transform: uppercase;">Back</b> to undo the color selection.',
      },
      {
        element: appbar.getElementById('forwardButton'),
        intro: 'And click <b style="text-transform: uppercase;">Forward</b> to go redo the color selection again.',
      },
      {
        element: appbar.getElementById('clearButton'),
        intro: 'You can clear all selections by clicking <b style="text-transform: uppercase;">Clear All</b>.',
      },
      {
        element: '#kpis',
        intro: 'These are calculations on the selections, automatically updated by Qlik Core.',
      },
      {
        element: '#bubbles',
        intro: 'Let\'s make a few selections!',
      },
      {
        element: '#kpis',
        intro: 'We see calculations being updated',
      },
      {
        element: appbar.getElementById('database'),
        intro: 'You can change the data set here.<br>Showing the logic is handled by Qlik Core in a totally generic way.',
      },
      {
        element: '.codesw',
        intro: 'You can view code snippets here<br>Showing how easy it is to get great data interactions!',
      },
      {
        intro: 'Have fun exploring the power of Qlik Core!',
      },
    ],
  });
  intro.start();
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
      helpGuide: _helpGuide,
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
  return new Promise((resolve) => {
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
      const updateBubbles = layout => new Promise((resol/* , reject */) => {
        const d = document.getElementById('one');
        d.update(layout, field, fields, _this.hoverIn, _this.hoverOut);
        resol();
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
          container.style.left = 0; // reset container position
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
      resolve();
    });
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

function createKpi(app, exp, label = 'kpi', elId, index) {
  return new Promise((resolve) => {
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
    const container = document.querySelectorAll('.kpi')[0];
    const elem = document.createElement('kpi-comp');
    elem.id = elId;
    const i = index || tableOrder.indexOf(label);
    elem.color = cssColors[i];
    container.append(elem);
    app.createSessionObject(props).then((model) => {
      const object = model;
      const update = () => object.getLayout().then((layout) => {
        const d = document.getElementById(elId);
        if (d) {
          d.data = layout.qHyperCube.qDataPages[0].qMatrix;
        }
      });
      object.on('changed', update);
      const d = document.getElementById(elId);
      if (d) {
        d.model = model;
        d.title = label;
        d.formula = exp;
        d.inputChangeDelegate = patchIt;
        d.allFields = tableOrder;
        d.colorBy = colors.domain(tableOrder).range(rangeColor);
        d.mouseover = hoverIn;
        d.mouseout = hoverOut;
      }
      update();
      resolve();
    });
  });
}

async function newDS(e, land = false) {
  const appbar = document.getElementsByTagName('app-bar')[0];
  appbar.disableListEnablement(true);
  let titleFields = [];
  tableOrder = [];
  document.getElementsByClassName('listbox_cnt')[0].innerHTML = '';
  document.getElementById('one').data = [];
  document.getElementById('one').fieldsCount = 0;
  document.getElementById('one').first = true;
  const properties = {
    qInfo: {
      qType: 'flist',
    },
    qFieldListDef: {},
  };
  const appIdMap = {
    car: '25ff2c3d-54de-449f-9301-4794a05160d2',
    fruit: '6fbb0a5c-f02a-4b40-b859-51bb62fdd7c7',
    music: '9d765859-b606-43c6-8836-2da68a257259',
  };
  const appId = 'process.env.NODE_ENV' === 'production' ? appIdMap[e] : `${e}.qvf`;
  const app = await connectEngine(appId);
  const obj = await app.createSessionObject(properties);
  const lay = await obj.getLayout();
  titleFields = lay.qFieldList.qItems.map(f => f.qName);
  curApp = app;
  createMyLists(app, titleFields);
  createHyperCube(app, titleFields);
  const container = document.querySelectorAll('.kpi')[0];
  container.innerHTML = '';
  const promises = [];
  titleFields.forEach((en, i) => {
    promises.push(createKpi(app, `count(distinct ${en})/count(distinct {1} ${en})*100`, en, `kp${i + 1}`));
  });
  return Promise.all(promises).then(() => {
    appbar.disableListEnablement(false);
    if (land === true) _helpGuide();
  });

  // createKpi(app, 'count(distinct Year)/count(distinct {1} Album)*100', 'Own KPI', `kp${titleFields.length + 1}`, titleFields.length);
}

window.toggleView = () => {
  document.querySelector('.container .vis_view').classList.toggle('fadeout');
  document.querySelector('.container .code_view').classList.toggle('fadein');
  const cppCodeView = document.querySelector('app-bar');
  // eslint-disable-next-line no-unused-expressions
  cppCodeView.getAttribute('variant') ? cppCodeView.removeAttribute('variant') : cppCodeView.setAttribute('variant', 'dark');
};

async function init() {
  newDS('car', true);
}


window.onresize = (resize);
init();
