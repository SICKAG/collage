/**
 * @copyright
 * Copyright(c) 2020 SICK AG
 */
/* eslint-disable @typescript-eslint/no-empty-function */

import { mapContextToApi, mapToServiceArray } from 'src/api/mappings.js';
import { Context } from 'src/model/context.js';

const objectWith = jasmine.objectContaining;

describe('mappings::mapToServiceArray', () => {
  it('should return an empty array for undefined or empty services', () => {
    expect(mapToServiceArray()).toHaveSize(0);
    expect(mapToServiceArray({})).toHaveSize(0);
  });

  it('should translate fields into service objects', () =>{
    const serviceList = mapToServiceArray({
      foo() {},
      bar: {
        bla() {},
        blubb() {}
      }
    });

    expect(serviceList).toHaveSize(2);
    expect(serviceList).toContain(objectWith({id: 'foo'}));
    expect(serviceList).toContain(objectWith({id: 'bar'}));
  });
});
describe('mappings::createSelfService', () => {});
describe('mappings::mapContextToApi', () => {
  it('should be able to unsubscribe from a topic on the api', async () => {
    const context = {
      unsubscribe: jasmine.createSpy(),
      getServiceRegistry() {
        return { keys: () => ['id:foo,version:xxx']};
      },
      receiveConfigFromParent(){}
    } as unknown as Context;

    const api = await mapContextToApi(context, []);

    await api.topics.foo.bar.unsubscribe();

    expect(context.unsubscribe).toHaveBeenCalledWith(
      objectWith({id: 'foo'}), ['bar']);
  });
});
