import React, { useMemo, useEffect } from 'react';
import usePromise from 'react-use-promise';
import enigma from 'enigma.js';

import Config from '../enigma';
import AppBar from './app-bar';
import Filterbox from './filterbox';
import Circles from './circles';
import Gauge from './gauge';
import Palette from './palette';

import './app.css';

const fields = ['Make', 'Model', 'BasePrice', 'TopSpeed', 'PriceRange'];
const expressions = fields.map(field => ({
  field,
  expression: `COUNT(DISTINCT [${field}])\n/ COUNT(DISTINCT {1} [${field}])\n* 100`,
}));

const useGlobal = session => usePromise(useMemo(() => session.open(), [session]));
const useApp = global => usePromise(useMemo(() => (global ? global.getDoc() : null), [global]));

export default function App() {
  const session = useMemo(() => enigma.create(Config), [false]);
  const [global, socketError] = useGlobal(session);
  const [app, appError] = useApp(global);

  if (socketError) throw socketError;
  if (appError) throw appError;

  useEffect(() => () => {
    if (!app) return;
    session.close();
  }, [app]);

  if (!app) {
    return (<p>Loading...</p>);
  }

  return (
    <div className="app">
      <AppBar app={app} />
      <div className="content">
        <div className="filters">
          {fields.map((f, i) => (
            <Filterbox
              app={app}
              key={f}
              field={f}
              color={Palette.get(i)}
            />
          ))}
        </div>
        <Circles app={app} fields={fields} />
        <div className="gauges">
          {expressions.map((e, i) => (
            <Gauge
              app={app}
              key={e.field}
              field={e.field}
              expression={e.expression}
              color={Palette.get(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
