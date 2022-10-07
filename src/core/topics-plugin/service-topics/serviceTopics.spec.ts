import { describe, it, expect } from 'jest-without-globals';
import { SimpleTopicsAPI } from '../simple-topics/model';
import { arrayToTopicsObject, extractEntriesFromObject, stringToObject } from './serviceTopics';

describe('Plugin: topic-stage-2', () => {
  it('should extract all topics from a services descripion part', async () => {
    const services = {
      language: {
        switchTo() { /* */ },
        topics: ['current'],
      },
      bla: {
        foo: {
          topics: ['foo', 'bla'],
          foo: {
            topics: ['foo'],
          },
        },
        bazz: {
          topics: ['bazz'],
        },
      },
    };
    expect(extractEntriesFromObject(services, 'topics')).toEqual(
      ['language.current',
        'bla.foo.foo',
        'bla.foo.bla',
        'bla.foo.foo.foo',
        'bla.bazz.bazz',
      ],
    );
  });

  it('should create a nested object from a dot-separated string', () => {
    const testee = 'level1.level2.level3';
    const appendee = {
      appendee1: '',
      appendee2: '',
      appendee3: '',
    };

    const expectee = {
      level1: {
        level2: {
          level3: {
            appendee1: '',
            appendee2: '',
            appendee3: '',
          },
        },
      },
    };

    const result = stringToObject(testee, appendee);
    expect(result).toEqual(expectee);
  });

  it('should convert array of path prepended topics to a Topics object', () => {
    const testee = [
      'language.current',
      'bla.foo.foo',
    ];
    const expectee = {
      language: {
        current: {
          publish: expect.any(Function),
          subscribe: expect.any(Function),
        },
      },
      bla: {
        foo: {
          foo: {
            publish: expect.any(Function),
            subscribe: expect.any(Function),
          },
        },
      },
    };

    const simpleTopics = {
      publish: (topic: string, message: unknown) => topic + message,
      subscribe: (topic: string, callback: (message: unknown) => unknown) => callback(topic),
      unsubscribe: (subscriptionId: string) => subscriptionId,
    };

    const result = arrayToTopicsObject(testee, simpleTopics as SimpleTopicsAPI);
    expect(result).toEqual(expectee);
  });
});
