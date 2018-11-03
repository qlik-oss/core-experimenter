import * as d3 from 'd3';

import { palette } from './palette';

function floatingTooltip(tooltipId, width) {
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

export default class Bubble {
  constructor(element) {
    const that = this;
    that.simTime = null;
    that.hovTime = null;
    that.selectDelegate = function noop() {};
    that.first = true;
    that.bubbles = null;
    that.svg = null;
    that.dataValue = {};
    that.stateCount = 4;
    that.colorBy = null;
    that.newSize(element.parentElement.offsetWidth, element.parentElement.offsetHeight + 20);
    that.stateMapping = {
      O: 'optional',
      A: 'alternative',
      X: 'excluded',
      S: 'selected',
      XS: 'selected_excluded',
    };
    that.forceStrength = 0.05;
    that.root = element;
    that.nodes = [];
    that.fields = [];
    that.fieldsCount = 0;
    that.simulation = d3.forceSimulation()
      .velocityDecay(0.27)
      .force('x', d3.forceX().strength(that.forceStrength).x(that.center.x))
      .force('y', d3.forceY().strength(that.forceStrength).y(that.center.y))
      .force('charge', d3.forceManyBody().strength((...args) => that.charge(...args)))
      .force('collision', d3.forceCollide().radius(d => d.radius))
      .on('tick', () => that.ticked());
    that.simulation.stop();
    that.fillColor = d3.scaleOrdinal(palette);
    this.tooltip = floatingTooltip('idf', 240);
    d3.selection.prototype.moveToFront = function moveToFront() {
      return this.each(function each() {
        this.parentNode.appendChild(this);
      });
    };
  }

  updateAll(data) {
    data.forEach(d => this.update(d.layout, d.field, data));
  }

  update(layout, fieldName, fields) {
    const mx = Math.max(this.nodes.length, layout.qListObject.qDataPages[0].qMatrix.length);
    const stateCArea = this.stateCircleR * this.stateCircleR * Math.PI;
    const areaPerPoint = (stateCArea / mx) * 0.9;
    const radiusPoint = Math.sqrt(areaPerPoint / Math.PI);
    layout.qListObject.qDataPages[0].qMatrix.map((r) => {
      const [e] = r;
      let found = false;
      this.nodes.map((el) => {
        /* eslint no-param-reassign:0 */
        if (el.id === e.qElemNumber && el.field === fieldName) {
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
          field: fieldName,
          value: e.qText,
          state: this.stateMapping[e.qState],
          x: this.stateCenters.optional.x + (Math.random() * 2 - 1) * this.stateCircleR * 1.5,
          y: this.stateCenters.optional.y + (Math.random() * 2 - 1) * this.stateCircleR * 1.5,
        });
      }
      return found;
    });
    if (this.fieldsCount === fields.length - 1) {
      setTimeout(() => {
        this.data = this.nodes;
        if (this.first === true && this.nodes.length > 0) {
          this.first = false;
          this.resize();
        }
        this.move();
        this.animate(this.radiusPoint);
      }, 100);
    } else {
      this.fieldsCount += 1;
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
    this.stateCircleR = (this.width / (this.stateCount * 2)) - 70;
    this.stateTitleX = {
      excluded: this.stateCenters.excluded.x,
      selected_excluded: this.stateCenters.selected_excluded.x,
      alternative: this.stateCenters.alternative.x,
      optional: this.stateCenters.optional.x,
      selected: this.stateCenters.selected.x,
    };
  }

  calculateBubbleRadius() {
    this.newSize(this.root.parentElement.offsetWidth, this.root.parentElement.offsetHeight);
    const { stateCircleR } = this;
    const stateCArea = stateCircleR * stateCircleR * Math.PI;
    const areaPerPoint = (stateCArea / this.nodes.length) * 0.9;
    return Math.sqrt(areaPerPoint / Math.PI);
  }

  lowlight(d) {
    const that = this;
    that.svg.selectAll('.bubble')
      .attr('opacity', 1);
    that.svg.select(`[mid='${d.field}.${d.id}']`).moveToFront()
      .transition()
      .duration(300)
      .attr('r', () => that.calculateBubbleRadius())
      .attr('stroke', c => d3.rgb(that.fillColor(c.field)).darker())
      .attr('fill', c => d3.rgb(that.fillColor(c.field)));
  }

  highlight(d) {
    const that = this;
    that.svg.selectAll('.bubble')
      .attr('opacity', 0.25);
    that.svg.selectAll(`[fld='${d.field}']`)
      .attr('opacity', 1);
    that.svg.select(`[mid='${d.field}.${d.id}']`).moveToFront()
      .transition()
      .attr('opacity', 1)
      .duration(300)
      .attr('r', that.calculateBubbleRadius() * 1.5)
      .attr('stroke', c => d3.rgb(that.fillColor(c.field)).darker())
      .attr('fill', c => d3.rgb(that.fillColor(c.field)).brighter());
  }

  charge(d) {
    return -(d.radius ** 2.0) * this.forceStrength;
  }

  ticked() {
    this.bubbles
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  }

  get data() {
    return this.dataValue;
  }

  set data(val) {
    // ToDo: implement validation
    this.nodes = val;
    if (this.first === true) {
      this.chart(this.radiusPoint);
      // this.invalidate();
    }
    // this.invalidate();
  }

  hideStatusText() {
    this.svg.selectAll('.state').remove();
  }

  showDetail(inst, d) {
    d3.select(this).attr('stroke', 'black');

    const content = `
<div class="title">${d.value}</div>
<span class="name">Field: </span><span class="value">${d.field}</span><br/>
<span class="name">State: </span><span class="value">${d.state}</span>
  `;

    inst.tooltip.showTooltip(content, d3.event);
    // this.highlightListBox(d);
    // this.lightChangeKPIs(d, 'highlight');
  }

  hideDetail(inst, d) {
    d3.select(this)
      .attr('stroke', d3.rgb(inst.fillColor(d.field)).darker());
    inst.tooltip.hideTooltip();
    // this.lowLightListBox(d);
    // this.lightChangeKPIs(d, 'lowlight');
  }

  async select(d) {
    const all = this.root.querySelectorAll('.states');
    for (let i = 0; i < all.length; i += 1) {
      if (!all[i].classList.contains('mainCircle')) {
        all[i].setAttribute('stroke', 'black');
      }
    }
    this.selectDelegate(d);
    // let field = await curApp.getField(d.field);
    // field.lowLevelSelect([d.id], true, false);
    this.tooltip.hideTooltip();
  }

  nodeStatePos(d) {
    if (d.state === 'selected_excluded') {
      return this.stateCenters[d.state].x - this.stateCircleR;
    }
    return this.stateCenters[d.state].x;
  }

  showStatusText() {
    const stateData = d3.keys(this.stateTitleX);
    const states = this.svg.selectAll('.state')
      .data(stateData);

    states.enter().append('text')
      .attr('class', 'state')
      .attr('x', d => this.stateTitleX[d])
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .text((d) => {
        if (d !== 'selected_excluded') return d.replace('_', '/');
        return '';
      });
  }

  move() {
    this.showStatusText();
    this.simulation.force('x', d3.forceX().strength(this.forceStrength).x((...args) => this.nodeStatePos(...args)));
    this.simulation.alphaTarget(0.25).restart();
    if (this.simTime != null) {
      clearTimeout(this.simTime);
    }
    this.simTime = setTimeout(() => {
      this.simulation.stop();
    }, 6000);
  }

  chart(radiusPoint) {
    const that = this;
    if (that.bubbles === null) {
      that.svg = d3.select(that.root)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%');
      Object.keys(that.stateCenters).forEach((e) => {
        that.svg.append('circle')
        // .attr('display', 'none')
          .classed('states', true)
          .classed('mainCircle', true)
          .attr('sta', e)
          .attr('cx', that.stateCenters[e].x)
          .attr('cy', that.stateCenters[e].y)
          .attr('fill', 'none')
          .attr('stroke-width', 2)
          .attr('stroke', '#ddd')
          .attr('stroke-dasharray', 1)
          .attr('r', that.stateCircleR);
      });
      that.bubbles = that.svg.selectAll('.bubble')
        .data(that.nodes, d => d.id);
    }
    that.bubbles = that.bubbles.data(that.nodes, d => d.id);
    that.bubbles.exit().remove();
    that.bubbles = that.bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', radiusPoint)
      .attr('st', d => d.state)
      .attr('cx', that.stateCenters.optional.x)
      .attr('opacity', 0)
      .attr('cy', that.stateCenters.optional.y)
      .attr('mid', d => `${d.field}.${d.id}`)
      .attr('fld', d => `${d.field}`)
      .attr('fill', d => that.fillColor(d.field))
      .attr('stroke-width', 2)
      .attr('stroke', d => d3.rgb(that.fillColor(d.field)).darker())
      .on('mouseover', function mouseover(d) {
        return that.showDetail.apply(this, [that, d]);
      })
      // .on('mouseover', this.highlightListBox)
      .on('mouseout', function mouseout(d) {
        return that.hideDetail.apply(this, [that, d]);
      })
      // .on('mouseout', this.lowLightListBox)
      .on('click', d => that.select(d))
      .merge(that.bubbles);
    if (that.nodes.length > 0) {
      that.simulation.nodes(that.nodes);
    }
    that.move();
  }

  animate(radiusPoint) {
    const that = this;
    this.bubbles
      .attr('mid', d => `${d.field}.${d.id}`)
      .attr('fld', d => `${d.field}`)
      .transition()
      .duration(500)
      .attr('opacity', () => 1)
      .delay((d, i) => Math.round(Math.random() * 250 + i * 2))
      .transition()
      .duration(500)
      .attr('stroke', d => d3.rgb(that.fillColor(d.field)).darker())
      .attr('stroke-width', (d) => {
        if (d.state === that.stateMapping.XS) {
          return 5;
        }
        return 2;
      })
      .attr('r', (d) => {
        if (d.state === that.stateMapping.XS) {
          return radiusPoint * 2;
        }
        return radiusPoint;
      })
      .attr('fill', (d) => {
        if (d.state === that.stateMapping.XS) {
          return 'white';
        }
        return that.fillColor(d.field);
      })
      .transition()
      .duration(1500)
      .attr('r', (d) => {
        if (d.state === that.stateMapping.XS) {
          return radiusPoint * 0.1;
        }
        return radiusPoint;
      })
      .transition()
      .duration(1500)
      .attr('r', (d) => {
        if (d.state === that.stateMapping.XS) {
          return radiusPoint * 1;
        }
        return radiusPoint;
      });
  }

  /*  invalidate() {
    if (!this.needsRender) {
      this.needsRender = true;
      Promise.resolve().then(() => {
        this.needsRender = false;
        render(this.template(), this.root);
      });
    }
  } */

  /*  connectedCallback() {
    render(this.template(), this.root);
  }
*/
  resize() {
    const that = this;
    const radiusPoint = this.calculateBubbleRadius();
    this.radiusPoint = radiusPoint;
    this.nodes.map((el) => {
      el.radius = radiusPoint;
      return true;
    });
    Object.keys(this.stateCenters).forEach((e) => {
      this.svg.select(`[sta='${e}']`)
        .attr('cx', that.stateCenters[e].x)
        .attr('cy', that.stateCenters[e].y)
        .attr('r', that.stateCircleR);
    });
    this.svg.selectAll('.state')
      .attr('y', '50%')
      .attr('x', d => that.stateTitleX[d])
      .attr('fill', 'black');
    this.first = true;
    this.data = this.nodes;
    this.first = false;
    this.simulation.force('y', d3.forceY().strength(this.forceStrength).y(this.center.y));
    this.animate(this.radiusPoint);
  }
/*
  template() {
    return html`
      <div id="vis" style="width:100%;height:100%"></div>
    `;
  } */
}
