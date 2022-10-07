/**
 * @copyright
 * Copyright(c) 2020 SICK AG
 */

import {
  ServiceDescription, SelfServiceDescription, FrontendDescription, ContextApi,
} from '../api/types';

export type VersionedService = { versions?: Record<string, ServiceDescription> }

export type SICKServiceDescription = VersionedService & ServiceDescription

export type SICKFrontendDescription = {
  services?: Record<string, SICKServiceDescription>
} & SelfServiceDescription

export type Expose = (_: FrontendDescription) => Promise<ContextApi>;
