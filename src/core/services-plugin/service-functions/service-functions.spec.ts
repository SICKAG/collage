import { describe, it, expect } from 'jest-without-globals';
import bootstrap from '../../../lib/bootstrap';
import serviceFunctions, { getNestedService } from './service-functions';
import { Context } from '../../../types';
import { PreviousContext } from '../model';

describe('Plugin: service functions', () => {
  it('should return a nested service from a services object', () => {
    const services = {
      level0: {
        level1: {
          test: () => { /* */ },
        },
      },
    };

    const result = getNestedService(services, [], 'level0');

    expect(result).toMatchObject({
      level1: {
        test: expect.any(Function),
      },
    });
  });

  it('should call a defined service', async () => {
    const { expose } = bootstrap([serviceFunctions]);
    const fooService = jest.fn();
    const api = await expose({
      services: {
        foo: fooService,
      },
    }) as Context;
    expect(api.services).toBeDefined();
    (api.services?.foo as CallableFunction)();
    expect(fooService).toHaveBeenCalled();
  });

  it('should call a defined service with arguments', async () => {
    const { expose } = bootstrap([serviceFunctions]);
    const fooService = jest.fn((x, y) => `${x} - ${y}`);
    const api = await expose({
      services: {
        foo: fooService,
      },
    }) as Context;
    const result = await (api.services?.foo as CallableFunction)('arg1', 'arg2');
    expect(result).toEqual('arg1 - arg2');
    expect(fooService).toHaveBeenCalledWith('arg1', 'arg2');
  });

  // it('should return the return value of a called service', async () => {
  //   const { expose } = bootstrap([serviceFunctions]);
  //   const fooService = jest.fn().mockReturnValue('returnValue');
  //   const api = await expose({
  //     services: {
  //       foo: fooService,
  //     },
  //   }) as Context;
  //   const result = (api.services?.foo as CallableFunction)();

  //   expect(result).toBe(123);
  // });

  it('should provide the arrangements\' service, if one exists', async () => {
    const parentFooService = jest.fn();
    const myFooService = jest.fn();
    const callService = jest.fn();

    const branchServices = {
      foo: parentFooService,
      callService,
    };

    const previousContext = {
      _plugins: {
        servicePlugin: {
          branchServices,
        },
      },
    } as PreviousContext;

    const { expose } = serviceFunctions(
      {
        expose: async () => (previousContext),
        updateContext: async () => (previousContext),
        reservedWords: [],
        extractContextAsArrangement: () => { /**/ },
        extractContextAsFragment: () => { /**/ },
        extractFragmentDescription: () => { /**/ },
      },
    );

    const api = await expose({
      services: {
        foo: myFooService,
      },
    });

    await (api.services?.foo as CallableFunction)();
    // service, nestedServicePath, args
    expect(callService).toHaveBeenCalled();
    expect(myFooService).not.toHaveBeenCalled();
  });
});

// TODO: write Tests for service-functions plugin
// import serviceFunctions from './service-functions';

// describe('Plugin: Service Functions', () => {
//   it('should create a service functions api', async () => {
//     const expose = serviceFunctions(async () => ({}));
//     const api = await expose({
//       services: {
//         foo: () => { /* ... */ },
//       },
//     });

//     expect(api).toMatchObject({
//       services: expect.objectContaining({
//         foo: expect.any(Function),
//       }),
//     });
//   });

//   it('should provide the arrangements\' service, if one exists', async () => {
//     const parentFooService = jest.fn();
//     const myFooService = jest.fn();
//     const expose = serviceFunctions(async () => ({
//       arrangement: {
//         services: {
//           foo: parentFooService,
//         },
//       },
//     }));

//     const api = await expose({
//       services: {
//         foo: myFooService,
//       },
//     });

//     await api.services.foo();

//     expect(parentFooService).toHaveBeenCalled();
//     expect(myFooService).not.toHaveBeenCalled();
//   });

//   it(`should provide the fragment's service,
//       if it doesn't exists on the arrangement`, async () => {
//     const parentFooService = jest.fn();
//     const myFooService = jest.fn();
//     const expose = serviceFunctions(async () => ({
//       arrangement: {
//         services: {
//           bar: parentFooService,
//         },
//       },
//     }));

//     const api = await expose({
//       services: {
//         foo: myFooService,
//       },
//     });

//     await api.services.foo();

//     expect(parentFooService).not.toHaveBeenCalled();
//     expect(myFooService).toHaveBeenCalled();
//   });

//   it(
//     'should provide the fragment\'s service, if no arrangement exists',
//     async () => {
//       const parentFooService = jest.fn();
//       const myFooService = jest.fn();
//       const expose = serviceFunctions(async () => ({}));

//       const api = await expose({
//         services: {
//           foo: myFooService,
//         },
//       });

//       await api.services.foo();

//       expect(parentFooService).not.toHaveBeenCalled();
//       expect(myFooService).toHaveBeenCalled();
//     },
//   );
// });
