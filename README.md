# Qlik Core Experimenter

_As of 1 July 2020, Qlik Core is no longer available to new customers. No further maintenance will be done in this repository._

An experiment aiming to show the power of the engine.

[![CircleCI](https://circleci.com/gh/qlik-oss/core-experimenter.svg?style=shield&circle-token=2cae0992d86b3a7c6960b1f5d912e1295f23104f)](https://circleci.com/gh/qlik-oss/core-experimenter)

## How to run locally

_Be sure to run `npm install` the first time._

Note that you must accept the [Qlik Core EULA](https://core.qlik.com/eula/) by setting the `ACCEPT_EULA`
environment variable.

```sh
ACCEPT_EULA=yes docker-compose up -d
```

Start the app:

```
$ npm start
```

Check `package.json` for other common npm tasks.
