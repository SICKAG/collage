import { describe, it, expect } from 'jest-without-globals';
import { createFragmentUUID, isCollageUUID, v4 } from './uuid';

describe('Lib: uuid', () => {
  it('should return true for valid collage uuids from a static list', () => {
    const staticTestee = [];
    staticTestee.push('collage-fragment-4e5f732e-3fa8-476a-9963-b83b51dcc435');
    staticTestee.push('collage-fragment-2a10ee1f-0042-4772-85fc-2df19cd74c23');
    staticTestee.push('collage-fragment-ca587a9e-8c34-47bb-83a6-e6d25f27fa4b');
    staticTestee.push('collage-fragment-4db9a582-4269-4c76-97d1-316dd29d00d6');
    staticTestee.push('collage-fragment-0f037884-13a5-4226-b740-a90b9601fa16');

    staticTestee.forEach((id) => {
      expect(isCollageUUID(id)).toBeTruthy();
    });
  });

  it('should return true for valid randomly generated collage uuids', () => {
    const randomTestee = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 15; i++) {
      randomTestee.push(`collage-fragment-${v4()}`);
    }

    randomTestee.forEach((id) => {
      expect(isCollageUUID(id)).toBeTruthy();
    });
  });

  it('should create a valid collageUUID', () => {
    const testee = createFragmentUUID();
    expect(isCollageUUID(testee)).toBeTruthy();
  });
});
