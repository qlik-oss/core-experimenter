import React from 'react';
import PropTypes from 'prop-types';

import useListObjectModel from './use/list-object-model';
import useLayout from './use/layout';

import './filterbox.css';

function createItem(row, model) {
  const classMap = {
    selected: row[0].qState === 'S',
    optional: row[0].qState === 'O',
    excluded: row[0].qState === 'X',
  };
  const classes = Object.keys(classMap).filter(k => classMap[k]).join(' ');
  const selectValue = () => model.selectListObjectValues(
    '/qListObjectDef',
    [row[0].qElemNumber],
    true,
    true,
  );
  return (
    <li key={row[0].qElemNumber} className={classes} onClick={selectValue}>
      {row[0].qText}
    </li>
  );
}

export default function Filterbox({ app, field, color }) {
  const model = useListObjectModel(app, field);
  const layout = useLayout(model);

  if (!layout) {
    return (<p>Loading...</p>);
  }

  const items = layout.qListObject.qDataPages[0].qMatrix.map(r => createItem(r, model));

  return (
    <div className="filterbox" style={{ backgroundColor: color }}>
      <p>{layout.qListObject.qDimensionInfo.qFallbackTitle}</p>
      <ul>{items}</ul>
    </div>
  );
}

Filterbox.propTypes = {
  app: PropTypes.object.isRequired,
  field: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};
