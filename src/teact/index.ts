import * as teact from './teact';
import * as teactDom from './teact-dom';

const {
  default: teactDefault,
  ...Teact
} = teact;

Object.assign(Teact, teactDefault);

const {
  default: teactDomDefault,
  ...TeactDOM
} = teactDom;

Object.assign(TeactDOM, teactDomDefault);

export { Teact, TeactDOM };
