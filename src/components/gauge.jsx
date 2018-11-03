import React from 'react';
import PropTypes from 'prop-types';

import useModel from './use/model';
import useLayout from './use/layout';

import './gauge.css';

export default function Gauge({
  app, field, expression, color,
}) {
  const model = useModel(app, {
    qInfo: { qType: 'expression' },
    expr: { qValueExpression: { qExpr: expression } },
  });
  const layout = useLayout(model);

  if (!layout) {
    return (<p>Loading...</p>);
  }

  // assume maxValue is expr if it's above 100:
  const maxValue = layout.expr > 100 ? layout.expr : 100;
  const stroke = 7;
  const radius = window.innerHeight / 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = ((maxValue - layout.expr) / maxValue * circumference);
  const updateExpression = async (val) => {
    const properties = await model.getProperties();
    properties.expr.qValueExpression.qExpr = val;
    await model.setProperties(properties);
  };

  return (
    <div className="gauge">
      <div>{field}</div>
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke={color}
          fill="transparent"
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: offset,
          }}
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <text
          x="50%"
          y="50%"
          alignmentBaseline="middle"
          textAnchor="middle"
        >
          {layout.expr}
        </text>
      </svg>
      <textarea
        defaultValue={expression}
        onChange={e => updateExpression(e.target.value)}
      />
    </div>
  );
}

Gauge.propTypes = {
  app: PropTypes.object.isRequired,
  field: PropTypes.string.isRequired,
  expression: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};
