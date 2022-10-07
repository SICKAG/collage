/**
 * @copyright
 * Copyright(c) 2020 SICK AG
 */

import { ContextApi, FrontendDescription, Obj } from '../api/types';

export type Theme = Obj<string>;
export type ThemedFrontendDescription = {theme?: Theme} & FrontendDescription;
export type ThemeApi = {change: (_: Theme) => void}
export type ThemableContextApi = {theme: ThemeApi} & ContextApi;
