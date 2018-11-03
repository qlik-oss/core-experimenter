import React from 'react';
import PropTypes from 'prop-types';

import logo from '../assets/cppg.svg';
import './app-bar.css';

export default function AppBar({ app }) {
  return (
    <div className="app-bar">
      <div className="left">
        <img src={logo} alt="Qlik Core Experimenter" />
      </div>
      <div className="middle">Qlik Core Experimenter</div>
      <ul className="right">
        <li onClick={() => app.clearAll()}>Clear all</li>
        <li onClick={() => app.back()}>Back</li>
        <li onClick={() => app.forward()}>Forward</li>
        <li>Code</li>
        <li>Guide</li>
      </ul>
    </div>
  );
}

AppBar.propTypes = {
  app: PropTypes.object.isRequired,
};
