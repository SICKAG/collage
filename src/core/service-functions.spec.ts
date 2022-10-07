import serviceFunctions from './service-functions';

describe('Plugin: Service Functions', () => {
  it('should create a service functions api', async () => {
    const expose = serviceFunctions(async () => ({}));
    const api = await expose({
      services: {
        foo: () => { /* ... */ },
      },
    });

    expect(api).toMatchObject({
      services: expect.objectContaining({
        foo: expect.any(Function),
      }),
    });
  });

  it('should provide the arrangements\' service, if one exists', async () => {
    const parentFooService = jest.fn();
    const myFooService = jest.fn();
    const expose = serviceFunctions(async () => ({
      arrangement: {
        services: {
          foo: parentFooService,
        },
      },
    }));

    const api = await expose({
      services: {
        foo: myFooService,
      },
    });

    await api.services.foo();

    expect(parentFooService).toHaveBeenCalled();
    expect(myFooService).not.toHaveBeenCalled();
  });

  it(`should provide the fragment's service,
      if it doesn't exists on the arrangement`, async () => {
    const parentFooService = jest.fn();
    const myFooService = jest.fn();
    const expose = serviceFunctions(async () => ({
      arrangement: {
        services: {
          bar: parentFooService,
        },
      },
    }));

    const api = await expose({
      services: {
        foo: myFooService,
      },
    });

    await api.services.foo();

    expect(parentFooService).not.toHaveBeenCalled();
    expect(myFooService).toHaveBeenCalled();
  });

  it(
    'should provide the fragment\'s service, if no arrangement exists',
    async () => {
      const parentFooService = jest.fn();
      const myFooService = jest.fn();
      const expose = serviceFunctions(async () => ({}));

      const api = await expose({
        services: {
          foo: myFooService,
        },
      });

      await api.services.foo();

      expect(parentFooService).not.toHaveBeenCalled();
      expect(myFooService).toHaveBeenCalled();
    },
  );
});
