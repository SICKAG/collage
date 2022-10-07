/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */
import core from '../api/index';
import versioned from './service-versions';
import themable from './themable';

export default [versioned, themable].reduce((api, plugin) => plugin(api), core);
