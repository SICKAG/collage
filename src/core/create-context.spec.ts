import createContext from './create-context';
import { callBeacon, createBeacon } from '../lib/beacon';

jest.mock('../lib/beacon');

describe('Plugin: create-context', () => {
  it('should assign a unique context id', async () => {
    const expose = createContext(async () => { /* ... */ });
    const result = await expose();
    expect(result).toMatchObject({
      id: expect.stringMatching(/.+/),
    });
  });

  it('should create a beacon before (!) expose', async () => {
    createContext(async () => { /* ... */ });
    expect(createBeacon).toHaveBeenCalled();
  });

  [true, false].forEach((embedded) => it(
    `should store that we are${embedded ? '' : ' not'} embedded in the context`,
    async () => {
      (callBeacon as jest.Mock).mockResolvedValueOnce(embedded && 'an-origin');
      const expose = createContext(async () => { /* ... */ });
      const result = await expose();
      expect(result).toMatchObject(
        embedded ? { parentOrigin: 'an-origin' } : {},
      );
    },
  ));
});
