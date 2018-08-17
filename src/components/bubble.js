import * as d3 from 'd3';
import { render, html } from '../../node_modules/lit-html/lib/lit-extended';

import utils from '../utils/utils';

let _this;

class Bubble extends HTMLElement {
  constructor() {
    super();
    _this = this;
    this.simTime = null;
    this.hovTime = null;
    this.selectDelegate = function () {
    };
    this.first = true;
    this.bubbles = null;
    this.svg = null;
    this.dataValue = {};
    this.stateCount = 4;
    this.colorBy = null;
    this.newSize(this.parentElement.offsetWidth, this.parentElement.offsetHeight + 20);
    this.stateMapping = utils.states;
    this.forceStrength = 0.05;
    this.root = this.attachShadow({ mode: 'open' });
    this.nodes = [];
    this.fields = [];
    this.simulation = d3.forceSimulation()
      .velocityDecay(0.27)
      .force('x', d3.forceX().strength(this.forceStrength).x(this.center.x))
      .force('y', d3.forceY().strength(this.forceStrength).y(this.center.y))
      .force('charge', d3.forceManyBody().strength(this.charge))
      .force('collision', d3.forceCollide().radius(d => d.radius))
      .on('tick', this.ticked);
    this.simulation.stop();
    this.fillColor = d3.scaleOrdinal(d3.schemeCategory10);
    this.tooltip = this.floatingTooltip('idf', 240);
    d3.selection.prototype.moveToFront = function () {
      return this.each(function () {
        this.parentNode.appendChild(this);
      });
    };
  }

  update(layout, field, fields) {
    const mx = Math.max(this.nodes.length, layout.qListObject.qDataPages[0].qMatrix.length);
    const stateCArea = this.stateCircleR * this.stateCircleR * Math.PI;
    const areaPerPoint = (stateCArea / mx) * 0.9;
    const radiusPoint = Math.sqrt(areaPerPoint / Math.PI);
    layout.qListObject.qDataPages[0].qMatrix.map((e) => {
      [e] = e;
      let found = false;
      this.nodes.map((el) => {
        if (el.id === e.qElemNumber && el.field === field) {
          el.state = this.stateMapping[e.qState];
          el.radius = radiusPoint;
          found = true;
        }
        return found;
      });
      if (!found) {
        this.nodes.push({
          id: e.qElemNumber,
          radius: radiusPoint,
          field,
          value: e.qText,
          state: this.stateMapping[e.qState],
          x: Math.random() * 900,
          y: Math.random() * 800,
        });
      }
      return found;
    });
    this.fields.push(field);
    if (this.fields.length === fields.length) {
      setTimeout(() => {
        this.data = this.nodes;
        this.resize();
      }, 100);
    }
    this.radiusPoint = radiusPoint;
  }

  newSize(w, h) {
    this.width = w;
    this.height = h;
    this.center = { x: this.width / 2, y: this.height / 2 };
    this.stateWidth = this.width / (this.stateCount) - 2;
    this.firstCenter = this.stateWidth - (this.stateWidth / 2);
    this.stateCenters = {
      excluded: { x: this.firstCenter, y: this.height / 2 },
      alternative: { x: this.firstCenter + (this.stateWidth), y: this.height / 2 },
      optional: { x: this.firstCenter + (this.stateWidth * 2), y: this.height / 2 },
      selected: { x: this.firstCenter + (this.stateWidth * 3), y: this.height / 2 },
      selected_excluded: { x: this.firstCenter + (this.stateWidth * 3), y: this.height / 2 },
    };
    this.stateCircleR = (this.width / (this.stateCount * 2)) - 20;
    this.stateTitleX = {
      excluded: this.stateCenters.excluded.x,
      selected_excluded: this.stateCenters.selected_excluded.x,
      alternative: this.stateCenters.alternative.x,
      optional: this.stateCenters.optional.x,
      selected: this.stateCenters.selected.x,
    };
  }

  lowlight(d) {
    this.svg.selectAll('.bubble')
      .attr('opacity', 1);
    this.svg.select(`[mid='${d.field}.${d.id}']`).moveToFront()
      .transition()
      .duration(300)
      .attr('stroke', c => d3.rgb(_this.fillColor(c.field)).darker())
      .attr('fill', c => d3.rgb(_this.fillColor(c.field)));
  }

  highlight(d) {
    this.svg.selectAll('.bubble')
      .attr('opacity', 0.25);
    this.svg.selectAll(`[fld='${d.field}']`)
      .attr('opacity', 1);
    this.svg.select(`[mid='${d.field}.${d.id}']`).moveToFront()
      .transition()
      .attr('opacity', 1)
      .duration(300)
      .attr('stroke', c => d3.rgb(_this.fillColor(c.field)).brighter())
      .attr('fill', c => d3.rgb(_this.fillColor(c.field)).darker().darker());
  }

  charge(d) {
    return -Math.pow(d.radius, 2.0) * _this.forceStrength;
  }

  ticked() {
    _this.bubbles
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  }

  get data() {
    return this.dataValue;
  }

  set data(val) {
    // ToDo: implement validation
    this.nodes = val;
    this.chart('#vis', this.radiusPoint);
    // this.invalidate();
  }

  hideStatusText() {
    this.svg.selectAll('.state').remove();
  }

  showDetail(d) {
    d3.select(this).attr('stroke', 'black');

    const content = `<div class="title">${d.value}</div>`
      + `<span class="name">Field: </span><span class="value">${d.field}</span><br/>`
      + `<span class="name">State: </span><span class="value">${d.state}</span>`;
    // `<button onclick="sel('${d.field}',${d.id})">Select </button>`;

    _this.tooltip.showTooltip(content, d3.event);
    _this.highlightListBox(d);
    _this.lightChangeKPIs(d, 'highlight');
    // setTimeout(()=>{
    //    tooltip.hideTooltip();
    // },3000)
  }

  hideDetail(d) {
    d3.select(this)
      .attr('stroke', d3.rgb(_this.fillColor(d.field)).darker());
    _this.tooltip.hideTooltip();
    _this.lowLightListBox(d);
    _this.lightChangeKPIs(d, 'lowlight');
  }

  async select(d) {
    const all = _this.root.querySelectorAll('.states');
    for (let i = 0; i < all.length; i++) {
      all[i].setAttribute('stroke', 'black');
    }
    _this.selectDelegate(d);
    // let field = await curApp.getField(d.field);
    // field.lowLevelSelect([d.id], true, false);
    _this.tooltip.hideTooltip();
  }

  nodeStatePos(d) {
    if (d.state === 'selected_excluded') {
      return _this.stateCenters[d.state].x - _this.stateCircleR;
    }
    return _this.stateCenters[d.state].x;
  }

  showStatusText() {
    const stateData = d3.keys(this.stateTitleX);
    const states = this.svg.selectAll('.state')
      .data(stateData);

    states.enter().append('text')
      .attr('class', 'state')
      .attr('x', d => _this.stateTitleX[d])
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .text((d) => {
        if (d !== 'selected_excluded') return d.replace('_', '/');
        return '';
      });
  }

  move() {
    this.showStatusText();
    this.simulation.force('x', d3.forceX().strength(this.forceStrength).x(this.nodeStatePos));
    this.simulation.alphaTarget(0.25).restart();
    if (this.simTime != null) {
      clearTimeout(this.simTime);
    }
    this.simTime = setTimeout(() => {
      this.simulation.stop();
    }, 6000);
  }

  _getListboxObjects(d) {
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

  lowLightListBox(d) {
    const res = _this._getListboxObjects(d).listObject;
    // res.style.background = d3.rgb(this.fillColor(d.field));
    // res.style.color = '#595959';
    res.style.opacity = '';
  }

  highlightListBox(d) {
    const res = _this._getListboxObjects(d);
    res.listBox.awaitSetInFocus(0);
    res.listObject.parentNode.scrollTop = res.listObject.offsetTop
      - res.listObject.parentNode.offsetTop;
    // res.listObject.style.background = d3.rgb(this.fillColor(d.field)).darker();
    // res.listObject.style.color = '#fff';
    res.listObject.style.opacity = 1;
  }


  lightChangeKPIs(d, lightOption) {
    const kpiElements = document.getElementsByTagName('kpi-comp');
    for (let i = 0; i < kpiElements.length; i++) {
      const children = kpiElements[i].shadowRoot.childNodes;
      for (let j = 0; j < children.length; j++) {
        if (children[j].nodeName === 'DIV') {
          const currentFields = children[j].getElementsByTagName('span');
          for (let k = 0; k < currentFields.length; k++) {
            if (currentFields[k].className.indexOf(`field${this.fields.indexOf(d.field)}`) !== -1) {
              if (lightOption === 'highlight') {
                currentFields[k].classList.add('highlightText');
                currentFields[k].style.color = d3.rgb(this.fillColor(d.field)).darker();
              } else if (lightOption === 'lowlight') {
                currentFields[k].classList.remove('highlightText');
                currentFields[k].style.color = d3.rgb(this.fillColor(d.field));
              }
            }
          }
        }
      }
    }
  }

  chart(selector, radiusPoint) {
    if (this.bubbles == null) {
      this.svg = d3.select(this.root).select(selector)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%');
      Object.keys(this.stateCenters).forEach((e) => {
        this.svg.append('circle')
        // .attr('display', 'none')
          .classed('states', true)
          .attr('sta', e)
          .attr('cx', this.stateCenters[e].x)
          .attr('cy', this.stateCenters[e].y)
          .attr('fill', 'none')
          .attr('stroke-width', 1)
          .attr('stroke', 'black')
          .attr('r', this.stateCircleR);
      });
      this.bubbles = this.svg.selectAll('.bubble')
        .data(this.nodes, d => d.id);
      this.simulation.nodes(this.nodes);
    }
    this.bubbles = this.bubbles.data(this.nodes, d => d.id);
    this.bubbles.exit().remove();
    this.bubbles = this.bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', radiusPoint)
      .attr('st', d => d.state)
      .attr('mid', d => `${d.field}.${d.id}`)
      .attr('fld', d => `${d.field}`)
      .attr('fill', d => this.fillColor(d.field))
      .attr('stroke', d => d3.rgb(this.fillColor(d.field)).darker())
      .attr('stroke-width', 2)
      .on('mouseover', this.showDetail)
      // .on('mouseover', this.highlightListBox)
      .on('mouseout', this.hideDetail)
      // .on('mouseout', this.lowLightListBox)
      .on('click', this.select)
      .merge(this.bubbles);
    this.simulation.nodes(this.nodes);
    this.bubbles.transition()
      .duration(1500)
      .attr('stroke-width', (d) => {
        if (d.state === this.stateMapping.XS) {
          return 5;
        }
        return 2;
      })
      .attr('r', (d) => {
        if (d.state === this.stateMapping.XS) {
          return radiusPoint * 2;
        }
        return radiusPoint;
      })
      .attr('fill', (d) => {
        if (d.state === this.stateMapping.XS) {
          return 'white';
        }
        return this.fillColor(d.field);
      })
      .transition()
      .duration(1500)
      .attr('r', (d) => {
        if (d.state === this.stateMapping.XS) {
          return radiusPoint * 0.1;
        }
        return radiusPoint;
      })
      .transition()
      .duration(1500)
      .attr('r', (d) => {
        if (d.state === this.stateMapping.XS) {
          return radiusPoint * 1;
        }
        return radiusPoint;
      });
    this.move();
  }

  floatingTooltip(tooltipId, width) {
    const tt = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .attr('id', tooltipId)
      .style('pointer-events', 'none');


    if (width) {
      tt.style('width', width);
    }

    function hideTooltip() {
      tt.style('display', 'none');
    }

    hideTooltip();

    function updatePosition(event) {
      const xOffset = 20;
      const yOffset = 10;

      const ttw = tt.style('width');
      const tth = tt.style('height');

      const wscrY = window.scrollY;
      const wscrX = window.scrollX;

      const curX = (document.all) ? event.clientX + wscrX : event.pageX;
      const curY = (document.all) ? event.clientY + wscrY : event.pageY;
      let ttleft = ((curX - wscrX + xOffset * 2 + ttw) > window.innerWidth)
        ? curX - ttw - xOffset * 2 : curX + xOffset;

      if (ttleft < wscrX + xOffset) {
        ttleft = wscrX + xOffset;
      }

      let tttop = ((curY - wscrY + yOffset * 2 + tth) > window.innerHeight)
        ? curY - tth - yOffset * 2 : curY + yOffset;

      if (tttop < wscrY + yOffset) {
        tttop = curY + yOffset;
      }

      tt
        .style('top', `${tttop}px`)
        .style('left', `${ttleft - (parseInt(ttw, 10) / 2)}px`);
    }

    function showTooltip(content, event) {
      tt.style('display', 'block')
        .html(content);

      updatePosition(event);
    }

    return {
      showTooltip,
      hideTooltip,
      updatePosition,
    };
  }

  invalidate() {
    if (!this.needsRender) {
      this.needsRender = true;
      Promise.resolve().then(() => {
        this.needsRender = false;
        render(this.template(), this.root);
      });
    }
  }

  connectedCallback() {
    render(this.template(), this.root);
  }

  resize() {
    this.newSize(this.parentElement.offsetWidth, this.parentElement.offsetHeight + 20);
    const { stateCircleR } = this;
    const stateCArea = stateCircleR * stateCircleR * Math.PI;
    const areaPerPoint = (stateCArea / this.nodes.length) * 0.9;
    const radiusPoint = Math.sqrt(areaPerPoint / Math.PI);
    this.radiusPoint = radiusPoint;
    this.nodes.map((el) => {
      el.radius = radiusPoint;
      return true;
    });
    Object.keys(this.stateCenters).forEach((e) => {
      this.svg.select(`[sta='${e}']`)
        .attr('cx', this.stateCenters[e].x)
        .attr('cy', this.stateCenters[e].y)
        .attr('r', this.stateCircleR);
    });
    this.svg.selectAll('.state')
      .attr('y', 30)
      .attr('x', d => _this.stateTitleX[d]);
    this.data = this.nodes;
    this.simulation.force('y', d3.forceY().strength(this.forceStrength).y(_this.center.y));
  }

  template() {
    return html`
      <div id="vis" style="width:100%;height:100%"></div>
    `;
  }
}

customElements.define('bubble-chart', Bubble);
