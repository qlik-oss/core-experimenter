import React, {
  useRef, useEffect, useState, useMemo,
} from 'react';
import PropTypes from 'prop-types';
import usePromise from 'react-use-promise';

import { createDefinition } from './use/list-object-model';
import CircleRenderer from './circle-renderer';

import './circles.css';

function useListLayouts(app, fields) {
  const [models, modelsError] = usePromise(useMemo(() => Promise.all(
    fields.map(field => (app
      ? app.getOrCreateObject(createDefinition(field))
      : null)),
  ), [app]));
  const [layouts, setLayouts] = useState(null);

  if (modelsError) throw modelsError;

  useEffect(() => {
    if (!app || !models) return;
    const update = async () => {
      await app.getAppLayout();
      const newLayouts = await Promise.all(models.map(m => m.getLayout()));
      setLayouts(newLayouts);
    };
    app.on('changed', update);
    update();
  }, [models]);

  return layouts;
}

export default function Circles({ app, fields }) {
  const [renderer, setRenderer] = useState(null);
  const elementRef = useRef(null);
  const layouts = useListLayouts(app, fields);

  useEffect(() => {
    if (renderer) {
      renderer.selectDelegate = async ({ field, id }) => {
        const obj = await app.getField(field);
        obj.lowLevelSelect([id], true, false);
      };
    } else if (elementRef.current) {
      const instance = new CircleRenderer(elementRef.current);
      instance.data = [];
      setRenderer(instance);
    }
  }, [renderer, elementRef.current, app]);

  useEffect(() => {
    if (!renderer || !layouts) return;
    const data = fields.map((field, i) => ({ field, fields, layout: layouts[i] }));
    renderer.updateAll(data);
  }, [renderer, layouts]);

  return (<div className="circles"><div className="circle" ref={elementRef} /></div>);
}

Circles.propTypes = {
  app: PropTypes.object.isRequired,
  fields: PropTypes.array.isRequired,
};
