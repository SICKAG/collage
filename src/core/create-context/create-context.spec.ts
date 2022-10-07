import { describe, it, expect } from 'jest-without-globals';
import bootstrap from '../../lib/bootstrap';
import { Context } from '../../types';
import createContext from './create-context';

describe('Plugin: create-context', () => {
  afterEach(() => {
    window.name = '';
  });

  it('should assign an id with format `{identifier}-{uuidv4}`', async () => {
    const { expose } = bootstrap([createContext]);
    const result = await expose({});
    expect(result).toMatchObject({
      // eslint-disable-next-line max-len
      id: expect.stringMatching(/^collage-fragment-[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i),
    });
  });

  it('should use the window.name if the value is from format `{identifier}-{uuidv4}` ', async () => {
    const { expose } = bootstrap([createContext]);
    const expected = 'collage-fragment-1a942c85-54c6-4f39-b1dd-73afb2a42427';
    window.name = 'collage-fragment-1a942c85-54c6-4f39-b1dd-73afb2a42427';
    const { id } = await expose({}) as Context;
    expect(id).toBe(expected);
  });

  it('should create a new id if the value of window.name does not fit to format `{identifier}-{uuidv4}` ', async () => {
    const { expose } = bootstrap([createContext]);
    window.name = 'randomName';
    const { id } = await expose({}) as Context;
    expect(id).toMatch(/^collage-fragment-[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
  });
});
