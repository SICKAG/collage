/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import { BehaviorSubject, isObservable, Subscription } from 'rxjs';
import {
  convertServiceIdentificationToString,
  convertStringToServiceIdentification,
  getMethodType,
  getServiceIdentificationFromSubscriptionId,
  getSubscriptionId
} from 'src/utils/functions.js';
import { expose, Observable } from '../../src/Context.js';
import { Context } from '../../src/model/context.js';
import { MethodType, Service, ServiceIdentification } from '../../src/model/service-registry.js';

const testChild: string = `http://localhost:${window.location.port}/static/test.html`;
const testServicesChild: string = `http://localhost:${window.location.port}/static/test-services-collection.html`;
const testGrandChild: string = `http://localhost:${window.location.port}/static/test-grand-child.html`;
const testPubSubChild: string = `http://localhost:${window.location.port}/static/test-pub-sub.html`;
const testStyleSyncChild: string = `http://localhost:${window.location.port}/static/test-style-sync.html`;

const notAvailableChild: string = `http://localhost:${window.location.port}/static/notAvailable.html`;

describe('microfrontend orchestration tests', () => {

  beforeAll(async () => {
    const div = document.createElement('div');
    div.id = 'davinci-mfo-container';
    document.body.appendChild(div);
  });

  describe('Initial frame tests', () => {
    let context: Context | null;

    beforeEach(async () => {
      context = await expose([], []);
    });

    afterEach(() => {
      context = null;
      // Remove child from container
      const container = document.getElementById('davinci-mfo-container');
      if (container) {
        container.innerHTML = '';
      }
    });

    it('Should make a document to a fragment by calling the expose method', () => {
      expect(context).toBeDefined();
      expect(context?.getDescendants()).withContext('There are children available.').toHaveSize(0);
      expect(context?.getServiceRegistry()).withContext('There are services registered.').toHaveSize(0);
    });

    it('Should have a valid context after calling expose', () => {
      expect(context?.contextId).withContext('Context id is undefined').toBeDefined();
      expect(context?.contextId).withContext('Context id is not from format uuid v4').toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    });

  });

  describe('Service registry tests', () => {
    let context: Context | null;

    const services: Array<Service> = [
      {
        id: 'notification',
        version: '0.0.0',
        impl: () => { } // eslint-disable-line @typescript-eslint/no-empty-function
      }
    ];

    const serviceIdNotification: string = 'id:notification,version:0.0.0';
    const serviceIdTest1: string = 'id:test1,version:0.0.0';
    const serviceIdTest2: string = 'id:test2,version:0.0.0';


    afterEach(() => {
      context = null;
      // Remove child from container
      const container = document.getElementById('davinci-mfo-container');
      if (container) {
        container.innerHTML = '';
      }
    });

    it('Should add own services when exposing', async () => {
      context = await expose(services, []);
      const serviceRegistry = context.getServiceRegistry();
      expect(serviceRegistry).withContext('Wrong size of service map').toHaveSize(1);

      const serviceId: string = serviceRegistry.keys().next().value;
      expect(serviceId).withContext('Wrong service id.').toBe(serviceIdNotification);

      const contextId: string = context.contextId;
      expect(serviceRegistry.get(serviceIdNotification)).withContext('Service has to come from own context.').toBe(contextId);
    });

    it('Should add services of children to own context when child is registered on expose', async () => {
      context = await expose([], [testChild]);
      const serviceRegistry = context.getServiceRegistry();
      expect(serviceRegistry).withContext('Wrong size of service map').toHaveSize(4);

      expect(serviceRegistry.has(serviceIdNotification)).withContext('Notification service missing').toBeTrue();

      expect(serviceRegistry.has(serviceIdTest1)).withContext('Test1 service missing').toBeTrue();

      const contextId: string = context.contextId;
      expect(serviceRegistry.get(serviceIdNotification)).withContext('Service has to come from child context.').not.toBe(contextId);
    });

    it('Should take own service implementation if child with same service is registered', async () => {
      context = await expose(services, [testChild]);
      const serviceRegistry = context.getServiceRegistry();
      expect(serviceRegistry).withContext('Wrong size of service map').toHaveSize(4);
      const contextId: string = context.contextId;
      expect(serviceRegistry.get(serviceIdNotification)).withContext('Own service implementation has to be used.').toBe(contextId);
    });

    it('Should add services of children to own context when executing registerChildContext()', async () => {
      context = await expose([], []);
      await context.registerChildContext(testChild);
      const serviceRegistry = context.getServiceRegistry();
      expect(serviceRegistry).withContext('Wrong size of service map').toHaveSize(4);
      const contextId: string = context.contextId;
      expect(serviceRegistry.get(serviceIdNotification)).withContext('Service has to come from child context.').not.toBe(contextId);
    });

    it('Should add services of grand child to own context', async () => {
      context = await expose(services, [testGrandChild]);
      await delay(150);
      const serviceRegistry = context.getServiceRegistry();
      expect(serviceRegistry).withContext('Wrong size of service map').toHaveSize(4);

      expect(serviceRegistry.has(serviceIdTest1)).withContext('Test1 service missing').toBeTrue();
      expect(serviceRegistry.has(serviceIdTest2)).withContext('Test2 service missing').toBeTrue();

      const contextId: string = context.contextId;
      expect([contextId, serviceRegistry.get(serviceIdTest1)]).withContext('Service test2 has to come from another context.').not.toContain(serviceRegistry.get(serviceIdTest2));
      expect([contextId, serviceRegistry.get(serviceIdTest2)]).withContext('Service test1 has to come from another context.').not.toContain(serviceRegistry.get(serviceIdTest1));
    });

    it('Should throw error, if invalid service is called', async () => {
      const serviceId: string = 'id:invalidService,version:0.0.0';
      const expectedError: Error = new Error(`Service ${serviceId} is not part of service registry`);
      context = await expose(services, []);
      const promise = context.callService({ id: 'invalidService', version: '0.0.0' }, '', []);
      await expectAsync(promise).toBeRejectedWith(expectedError);
    });

    it('Should not be possible to call a service that is not implemented by ourself', async () => {
      const expectedError: Error = new Error('It is not possible to call a service, that is not implemented by yourself');
      context = await expose(services, [testChild]);
      const promise = context.callService({ id: 'test1', version: '0.0.0' }, '', []);
      await expectAsync(promise).toBeRejectedWith(expectedError);
    });

    it('Should deregister a service implementation from parent and exchange it with implementation of child', async () => {
      context = await expose(services, [testChild]);
      const oldServiceRegistry = context.getServiceRegistry();
      const implContextIdOld: string = oldServiceRegistry.get(serviceIdNotification) as string;
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const oldChildServiceRegistryStr = await callServiceFromChild(childIFrame, 'serviceRegistry', 'response');
      const oldChildServiceRegistry = JSON.parse(oldChildServiceRegistryStr);

      const serviceIdent: ServiceIdentification = { id: 'notification', version: '0.0.0' };
      await context.deregisterService(serviceIdent);

      const newServiceRegistry = context.getServiceRegistry();
      const implContextIdNew: string = newServiceRegistry.get(serviceIdNotification) as string;
      expect(implContextIdNew).not.toBe(implContextIdOld);

      // service registry of child should also updated
      await delay(0);
      const childServiceRegistryStr = await callServiceFromChild(childIFrame, 'serviceRegistry', 'response');
      const childServiceRegistry = JSON.parse(childServiceRegistryStr);
      expect(childServiceRegistry[serviceIdNotification]).not.toBe(oldChildServiceRegistry[serviceIdNotification]);

      // Service registries should be the same
      const newServiceRegistryStr = JSON.stringify(Object.fromEntries(newServiceRegistry));
      expect(newServiceRegistryStr).withContext('Service registries (children and parent) differ from each other').toBe(childServiceRegistryStr);
    });

    it('Should throw exception if a non available service should be deregistered', async () => {
      const errMsg = 'Service is not part of service registry';
      context = await expose(services, [testChild]);
      const serviceIdent: ServiceIdentification = { id: 'non-available', version: '0.0.0' };
      const promise = context.deregisterService(serviceIdent);
      await expectAsync(promise).toBeRejectedWith(errMsg);
    });

    it('Should throw exception if a service should be deregistered, which is the only available implementation', async () => {
      const errMsg = 'No other service implementation available';
      context = await expose(services, []);
      const serviceIdent: ServiceIdentification = { id: 'notification', version: '0.0.0' };
      const promise = context.deregisterService(serviceIdent);
      await expectAsync(promise).toBeRejectedWith(errMsg);
    });

    it('Should deregister a service implementation from child and exchange it with implementation of another child', async () => {
      context = await expose(services, [testChild, testGrandChild]);
      // delay is needed so testGrandChild is loaded completely
      // FIXME: Find better solution - delaying is not a stable option to ensure the testGrandChild is loaded
      await delay(300);

      const oldParentServiceRegistry = context.getServiceRegistry();
      const implContextIdOld: string = oldParentServiceRegistry.get(serviceIdTest2) as string;
      const child1IFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const child2IFrame = document.getElementsByTagName('iframe')[1] as HTMLIFrameElement;
      const oldChild1ServiceRegistryStr = await callServiceFromChild(child1IFrame, 'serviceRegistry', 'response');
      const oldChild1ServiceRegistry = JSON.parse(oldChild1ServiceRegistryStr);
      const oldChild2ServiceRegistryStr = await callServiceFromChild(child2IFrame, 'serviceRegistry', 'response');
      const oldChild2ServiceRegistry = JSON.parse(oldChild2ServiceRegistryStr);

      await callServiceFromChild(child1IFrame, 'deregister', 'response');

      // Child1 service registry is updated
      const child1ServiceRegistryStr = await callServiceFromChild(child1IFrame, 'serviceRegistry', 'response');
      const child1ServiceRegistry = JSON.parse(child1ServiceRegistryStr);
      expect(child1ServiceRegistry[serviceIdTest2]).not.withContext('test.html service registry is not updated').toBe(oldChild1ServiceRegistry[serviceIdTest2]);

      // Child2 service registry is updated
      const child2ServiceRegistryStr = await callServiceFromChild(child2IFrame, 'serviceRegistry', 'response');
      const child2ServiceRegistry = JSON.parse(child2ServiceRegistryStr);
      expect(child2ServiceRegistry[serviceIdTest2]).not.withContext('test-grand-child.html service registry is not updated').toBe(oldChild2ServiceRegistry[serviceIdTest2]);

      // Parent service registry is updated
      const newParentServiceRegistry = context.getServiceRegistry();
      const implContextIdNew: string = newParentServiceRegistry.get(serviceIdTest2) as string;
      expect(implContextIdNew).not.withContext('parent service registry is not updated').toBe(implContextIdOld);

      // all service registries should be the same
      expect(child1ServiceRegistryStr).withContext('Service registries (children) differ from each other').toBe(child2ServiceRegistryStr);
      const newParentServiceRegistryStr = JSON.stringify(Object.fromEntries(newParentServiceRegistry));
      expect(newParentServiceRegistryStr).withContext('Service registries (children and parent) differ from each other').toBe(child1ServiceRegistryStr);
    });

    it('Should reregister subscriptions after deregistration of pub sub service, so observables are still working when a publish is done', async () => {
      const expectedLang1: string = 'de';
      const expectedLang2: string = 'en';
      context = await expose(services, [testChild, testPubSubChild]);
      const childIFrame1 = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);
      const childIFrame2 = (document.getElementsByTagName('iframe')[1] as HTMLIFrameElement);

      await callServiceFromChild(childIFrame1, 'subscribe', 'response');
      await callServiceFromChild(childIFrame2, 'subscribe', 'langChanged');
      await callServiceFromChild(childIFrame2, 'publish', 'response');
      await delay(0);
      const langChild1 = (childIFrame1.contentDocument?.getElementById('response') as HTMLInputElement).value;
      const langChild2 = (childIFrame2.contentDocument?.getElementById('langChanged') as HTMLInputElement).value;

      await callServiceFromChild(childIFrame1, 'deregisterPubSub', 'response');
      await callServiceFromChild(childIFrame2, 'publish', 'response');
      await delay(0);
      const lang2Child1 = (childIFrame1.contentDocument?.getElementById('response') as HTMLInputElement).value;
      const lang2Child2 = (childIFrame2.contentDocument?.getElementById('langChanged') as HTMLInputElement).value;

      expect(langChild1).toBe(expectedLang1);
      expect(langChild2).toBe(expectedLang1);
      expect(lang2Child1).toBe(expectedLang2);
      expect(lang2Child2).toBe(expectedLang2);

    });

    it('Should throw exception if a non available service should be deregistered from child', async () => {
      const errMsg = 'Service is not part of service registry';
      context = await expose(services, [testChild, testGrandChild]);
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const response = await callServiceFromChild(childIFrame, 'deregisterInvalid', 'response');
      expect(response).toBe(errMsg);
    });

    it('Should throw exception if a service should be deregistered from child, which is the only available implementation', async () => {
      const errMsg = 'No other service implementation available';
      context = await expose(services, [testChild]);
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const response = await callServiceFromChild(childIFrame, 'deregister', 'response');
      expect(response).toBe(errMsg);
    });

    it('Should throw exception if a service should be deregistered from child, whose implementation is used from someone else', async () => {
      const errMsg = 'Another service implementation is used instead of the own';
      context = await expose(services, [testChild]);
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const response = await callServiceFromChild(childIFrame, 'deregisterNotOwn', 'response');
      expect(response).toBe(errMsg);
    });
  });

  describe('Child deregistration', () => {
    let context: Context | null;

    const services: Array<Service> = [
      {
        id: 'notification',
        version: '0.0.0',
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        impl: () => { }
      }
    ];

    afterEach(() => {
      context = null;
      // Remove child from container
      const container = document.getElementById('davinci-mfo-container');
      if (container) {
        container.innerHTML = '';
      }
    });

    it('Should remove child with its descendants from context map', async () => {
      context = await expose(services, [testGrandChild, testChild]);
      // delay is needed so testGrandChild is loaded completely
      await delay(150);
      const oldDescendants = context.getDescendants();
      const childId = oldDescendants[0];
      await context.deregisterChildContext(childId);
      const newDescendants = context.getDescendants();
      expect(newDescendants).not.toBe(oldDescendants);
      expect(newDescendants.length).toBe(1);
    });

    it('Should reregister services if other service implementation is available', async () => {
      const expectedTest2Response: string = 'from test.html test2 service test.html';
      const test2ServiceId: string = 'id:test2,version:0.0.0';
      context = await expose(services, [testGrandChild, testChild]);

      const childIFrame = (document.getElementsByTagName('iframe')[1] as HTMLIFrameElement);
      const oldChildServiceRegistryStr = await callServiceFromChild(childIFrame, 'serviceRegistry', 'response');
      const oldChildServiceRegistry = JSON.parse(oldChildServiceRegistryStr);

      // delay is needed so testGrandChild is loaded completely
      await delay(150);

      const oldTest2Response = await callServiceFromChild(childIFrame, 'test2', 'response');
      const oldServiceRegistry = context.getServiceRegistry();
      const childId = context.getDescendants()[0];
      await context.deregisterChildContext(childId);

      // Own service registry needs to be updated
      const newServiceRegistry = context.getServiceRegistry();
      expect(oldServiceRegistry.get(test2ServiceId)).not.toBe(newServiceRegistry.get(test2ServiceId));

      // Other service registries need to be updated
      const childServiceRegistryStr = await callServiceFromChild(childIFrame, 'serviceRegistry', 'response');
      const childServiceRegistry = JSON.parse(childServiceRegistryStr);
      expect(oldChildServiceRegistry[test2ServiceId]).not.toBe(childServiceRegistry[test2ServiceId]);

      // Reregistered service impl is used
      const newTest2Response = await callServiceFromChild(childIFrame, 'test2', 'response');
      expect(oldTest2Response).not.toBe(newTest2Response);
      expect(newTest2Response).toBe(expectedTest2Response);
    });

    it('Should remove service completely if no other service implementation is available', async () => {
      context = await expose(services, [testChild]);
      const oldServiceRegistry = context.getServiceRegistry();
      await context.deregisterChildContext(context.getDescendants()[0]);
      const newServiceRegistry = context.getServiceRegistry();
      expect(newServiceRegistry.size).toBeLessThan(oldServiceRegistry.size);
      expect(newServiceRegistry.size).toBe(1);
    });

    it('Should reregister subscriptions, so observables are still working when a publish is done', async () => {
      const expectedLang: string = 'de';
      context = await expose(services, [testPubSubChild, testChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[1] as HTMLIFrameElement);
      await callServiceFromChild(childIFrame, 'subscribe', 'response');
      await context.deregisterChildContext(context.getDescendants()[0]);
      await callServiceFromChild(childIFrame, 'publish', 'response');
      const lang = (childIFrame.contentDocument?.getElementById('response') as HTMLInputElement).value;
      expect(lang).toBe(expectedLang);
    });

    it('Should throw exception if a child should be deregistered with invalid context id', async () => {
      const errMsg = 'Invalid child id.';
      const invalidContextId: string = 'Invalid_ContextId';
      context = await expose(services, [testChild]);
      const promise = context.deregisterChildContext(invalidContextId);
      await expectAsync(promise).toBeRejectedWith(errMsg);
    });

    it('Should throw exception if a non-direct child should be deregistered', async () => {
      const errMsg = 'Child is no direct descendant. Only direct descendants can be deregistered.';
      context = await expose(services, [testGrandChild]);
      // delay is needed so testGrandChild is loaded completely
      await delay(150);
      const promise = context.deregisterChildContext(context.getDescendants()[1]);
      await expectAsync(promise).toBeRejectedWith(errMsg);
    });
  });

  describe('Child context map tests', () => {
    let context: Context | null;

    afterEach(() => {
      context = null;
      // Remove child from container
      const container = document.getElementById('davinci-mfo-container');
      if (container) {
        container.innerHTML = '';
      }
    });

    it('Should add children to own context when child is registered on expose', async () => {
      context = await expose([], [testChild]);
      const children = context.getDescendants();
      expect(children).withContext('Wrong size of children map').toHaveSize(1);
    });

    it('Should not add a not available child to context if it is registered on expose', async () => {
      context = await expose([], [notAvailableChild]);
      const children = context.getDescendants();
      expect(children).withContext('Wrong size of children map').toHaveSize(0);
    });

    it('Should add available children if a not-available one was tried to registered first (registered on expose)', async () => {
      context = await expose([], [notAvailableChild, testChild]);
      const children = context.getDescendants();
      expect(children).withContext('Wrong size of children map').toHaveSize(1);
    });

    it('Should add children to own context when executing registerChildContext()', async () => {
      const msg = 'registered';
      context = await expose([], []);

      const promise = context.registerChildContext(testChild);
      await expectAsync(promise).withContext('Unsuccessful register').toBeResolvedTo(msg);

      const serviceRegistry = context.getDescendants();
      expect(serviceRegistry).withContext('Wrong size of children map').toHaveSize(1);
    });


    it('Should not add a not available child to context when executing registerChildContext()', async () => {
      const errMsg = `Source ${notAvailableChild} not available`;
      context = await expose([], []);
      const promise = context.registerChildContext(notAvailableChild);
      await expectAsync(promise).toBeRejectedWith(errMsg);
      const serviceRegistry = context.getDescendants();
      expect(serviceRegistry).withContext('Wrong size of children map').toHaveSize(0);
    });

    it('Should add available children if a not-available one was tried to registered first (registered with registerChildContext())', async () => {
      context = await expose([], [testChild]);
      try {
        await context.registerChildContext(notAvailableChild);
      } catch (error) { }
      const serviceRegistry = context.getDescendants();
      expect(serviceRegistry).withContext('Wrong size of children map').toHaveSize(1);
    });


    it('Should add grand child to own context', async () => {
      context = await expose([], [testGrandChild]);
      await delay(150);
      const serviceRegistry = context.getDescendants();
      expect(serviceRegistry).withContext('Wrong size of children map').toHaveSize(2);
    });
  });

  describe('publish - subscribe tests', () => {
    let context: Context | null;
    let oldValue: string | undefined;
    let observable: Observable<unknown> | null;
    let subscription: Subscription | null;
    let throwError: boolean = false;

    const services: Array<Service> = [
      {
        id: 'languageService',
        version: '0.0.0',
        impl: async (method, _args) => {
          switch (method) {
            case 'publish':
              if (throwError) {
                throw new Error('Error in publish implementation.');
              }
              return '';
            case 'subscribe':
              if (throwError) {
                throw new Error('Error in subscribe implementation.');
              }
              return '';
            case 'unsubscribe':
              if (throwError) {
                throw new Error('Error in unsubscribe implementation.');
              }
              return '';
            case 'blubb':
              return ('it works!');
            default:
              return '';
          }
        },
        isSubscribable: true,
        subscriptionTopics: ['languageKey']
      },
      {
        id: 'subscribableService',
        version: '0.0.0',
        impl: async (_method, _args) => {
          // noop
        },
        isSubscribable: true,
        subscriptionTopics: ['testTopic']
      },
    ];

    beforeEach(async () => {
      context = await expose(services, []);
      observable = await context.callService({ id: 'languageService', version: '0.0.0' }, 'subscribe', ['languageKey']) as Observable<unknown>;
      oldValue = '';
      subscription = observable.subscribe((nextValue: string) => {
        oldValue = nextValue;
      });
    });

    afterEach(() => {
      context = null;
      oldValue = undefined;
      observable = null;
      subscription = null;
      throwError = false;
      // Remove child from container
      const container = document.getElementById('davinci-mfo-container');
      if (container) {
        container.innerHTML = '';
      }
    });

    it('Should return an observable when subscribing to a topic as parent', async () => {
      expect(isObservable(observable)).toBeTrue();
    });

    it('Should return an error when subscribing to an invalid topic as parent', async () => {
      const invalidTopic: string = 'invalidTopic';
      const expectedError: Error = new Error('Invalid topic. This service does not contain a topic called ' + invalidTopic);
      const promise = context?.callService({ id: 'languageService', version: '0.0.0' }, 'subscribe', [invalidTopic, 'en']);
      await expectAsync(promise).toBeRejectedWith(expectedError);
    });

    it('Should forward errors of a service implementation from subscribe called as parent', async () => {
      const expectedError: Error = new Error('Error in subscribe implementation.');
      throwError = true;
      const promise = context?.callService({ id: 'languageService', version: '0.0.0' }, 'subscribe', ['languageKey']);
      await expectAsync(promise).toBeRejectedWith(expectedError);
    });

    it('Should return the same observable when subscribing to a topic twice as parent', async () => {
      const observable2: Observable<unknown> = await context?.callService({ id: 'languageService', version: '0.0.0' }, 'subscribe', ['languageKey']) as Observable<unknown>;

      expect(observable).withContext('Multiple subscriptions should not end in different observables').toEqual(observable2);
    });

    it('should return the current value of the topic on subscribe', async () => {
      const expectedValue = 'published value';

      await context?.callService({ id: 'subscribableService', version: '0.0.0' }, 'publish', ['testTopic', 'published value']);
      const observable = await context?.callService({ id: 'subscribableService', version: '0.0.0' }, 'subscribe', ['testTopic']) as Observable<unknown>;

      let valueOnTopic = '';

      observable.subscribe((nextValue: string) => {
        valueOnTopic = nextValue;
      });

      expect(valueOnTopic).toBe(expectedValue);
    });

    it('Should get a message as parent if a new value was published as parent', async () => {
      const expectedValue: string = 'en';

      await context?.callService({ id: 'languageService', version: '0.0.0' }, 'publish', ['languageKey', 'en']);

      expect(oldValue).toBe(expectedValue);
    });

    it('Should return an error when publishing to an invalid topic as parent', async () => {
      const invalidTopic: string = 'invalidTopic';
      const expectedError: Error = new Error('Invalid topic. This service does not contain a topic called ' + invalidTopic);
      const promise = context?.callService({ id: 'languageService', version: '0.0.0' }, 'publish', [invalidTopic, 'en']);
      await expectAsync(promise).toBeRejectedWith(expectedError);
    });

    it('Should forward errors of a service implementation from publish called as parent', async () => {
      const expectedError: Error = new Error('Error in publish implementation.');
      throwError = true;
      const promise = context?.callService({ id: 'languageService', version: '0.0.0' }, 'publish', ['languageKey', 'en']);
      await expectAsync(promise).toBeRejectedWith(expectedError);
    });

    it('Should unsubscribe with observable as parent', async () => {
      const expectedValue: string = 'en';

      await context?.callService({ id: 'languageService', version: '0.0.0' }, 'publish', ['languageKey', 'en']);

      subscription?.unsubscribe();
      await context?.callService({ id: 'languageService', version: '0.0.0' }, 'publish', ['languageKey', 'de']);

      expect(oldValue).withContext('Value should not be changed after unsubscription.').toBe(expectedValue);
    });

    it('Should unsubscribe with callService as parent', async () => {
      const expectedValue: string = 'en';

      await context?.callService({ id: 'languageService', version: '0.0.0' }, 'publish', ['languageKey', 'en']);
      await context?.callService({ id: 'languageService', version: '0.0.0' }, 'unsubscribe', ['languageKey']);
      await context?.callService({ id: 'languageService', version: '0.0.0' }, 'publish', ['languageKey', 'de']);

      expect(oldValue).withContext('Value should not be changed after unsubscription.').toBe(expectedValue);
    });

    describe('syntactic suggar API', () => {

      it('should subscribe to a topic using syntactic suggar sweetened API', async () => {
        const expectedValue = 'initial value';
        let valueOnTopic = '';
        const service = services.find((service) => {
          return service.id === 'subscribableService';
        });

        const topics = service?.subscriptionTopics;

        if (service && topics) {
          await context?.subscribe(service, topics, (next: string) => {
            valueOnTopic = next;
          });
        }
        expect(valueOnTopic).toBe(expectedValue);
      });

      it('should publish a new value to a topic using syntactic suggar sweetened API', async () => {
        const expectedValue = 'brand new published value';
        let valueOnTopic = '';
        const service = services.find((service) => {
          return service.id === 'subscribableService';
        });

        const topics = service?.subscriptionTopics;

        if (!(context && service && topics)) {
          fail();
          return;
        }

        await context.publish(service, topics[0], expectedValue);

        await context.subscribe(service, topics, (next: string) => {
          valueOnTopic = next;
        });

        expect(valueOnTopic).toBe(expectedValue);
      });

      it('should unsubscribe from topic using syntactic sugar sweetened api', async () => {
        const expectedValue: string = 'en';
        const service = services.find((service) => {
          return service.id === 'languageService';
        });

        await context?.callService({ id: 'languageService', version: '0.0.0' }, 'publish', ['languageKey', 'en']);
        await context?.unsubscribe(service as Service, ['languageKey']);
        await context?.callService({ id: 'languageService', version: '0.0.0' }, 'publish', ['languageKey', 'de']);

        expect(oldValue).withContext('Value should not be changed after unsubscription.').toBe(expectedValue);
      });
    });

    it('Should return an error when unsubscribing to an invalid topic as parent', async () => {
      const invalidTopic: string = 'invalidTopic';
      const expectedError: Error = new Error('Invalid topic. This service does not contain a topic called ' + invalidTopic);
      const promise = context?.callService({ id: 'languageService', version: '0.0.0' }, 'unsubscribe', [invalidTopic, 'en']);
      await expectAsync(promise).toBeRejectedWith(expectedError);
    });

    it('Should forward errors of a service implementation from unsubscribe called as parent', async () => {
      const expectedError: Error = new Error('Error in unsubscribe implementation.');
      throwError = true;
      const promise = context?.callService({ id: 'languageService', version: '0.0.0' }, 'unsubscribe', ['languageKey']);
      await expectAsync(promise).toBeRejectedWith(expectedError);
    });

    it('Should return an observable when subscribing to a topic as child', async () => {
      const msg = 'true';
      context = await expose(services, [testPubSubChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);

      const promise = callServiceFromChild(childIFrame, 'subscribeIsObservable', 'response');
      await expectAsync(promise).toBeResolvedTo(msg);
    });

    it('Should return an error when subscribing to an invalid topic as child', async () => {
      const expectedError: string = 'Error: Invalid topic. This service does not contain a topic called invalidTopic';
      context = await expose(services, [testPubSubChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);

      const promise = callServiceFromChild(childIFrame, 'subscribeInvalid', 'langChanged');
      await expectAsync(promise).toBeResolvedTo(expectedError);
    });

    it('Should forward errors of a service implementation from subscribe called as child', async () => {
      const expectedError: string = 'Error: Error in subscribe implementation.';
      throwError = true;
      context = await expose(services, [testPubSubChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);
      const promise = callServiceFromChild(childIFrame, 'subscribe', 'langChanged');
      await expectAsync(promise).toBeResolvedTo(expectedError);
    });

    it('Should return the same observable when subscribing to a topic twice as child', async () => {
      context = await expose(services, [testPubSubChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);

      await callServiceFromChild(childIFrame, 'subscribe', 'langChanged');
      await callServiceFromChild(childIFrame, 'publish', 'response');
      const lang = (childIFrame.contentDocument?.getElementById('langChanged') as HTMLInputElement).value;
      await callServiceFromChild(childIFrame, 'subscribe', 'langChanged');
      const lang2 = (childIFrame.contentDocument?.getElementById('langChanged') as HTMLInputElement).value;
      // Can not be tested like the parent. Is done via looking if the published value is set to inital value of observable or stays the published value

      expect(lang2).withContext('Multiple subscriptions should not end in different observables').toBe(lang);
    });

    it('Should get a message as parent if a new value was published as child', async () => {
      context = await expose(services, [testPubSubChild]);
      const observable: BehaviorSubject<unknown> = await context.callService({ id: 'languageService', version: '0.0.0' }, 'subscribe', ['languageKey']) as BehaviorSubject<unknown>;
      let oldValue: string = '';
      observable.subscribe((nextValue: string) => {
        oldValue = nextValue;
      });

      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);
      await callServiceFromChild(childIFrame, 'publish', 'response');
      const expectedValue: string = 'de';

      expect(oldValue).toBe(expectedValue);
    });

    it('Should get a message as child if a new value was published as parent', async () => {
      context = await expose(services, [testPubSubChild]);
      await context.callService({ id: 'languageService', version: '0.0.0' }, 'subscribe', ['languageKey']);

      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);
      await callServiceFromChild(childIFrame, 'subscribe', 'langChanged');

      // Need to wait for the parent to update its subscription map
      await delay(0);
      await context.callService({ id: 'languageService', version: '0.0.0' }, 'publish', ['languageKey', 'en']);

      // Need to wait for the publish to the child is done
      await delay(0);

      const newValue = (childIFrame.contentDocument?.getElementById('langChanged') as HTMLInputElement).value;
      const expectedValue: string = 'en';

      expect(newValue).toBe(expectedValue);
    });

    it('Should return an error when publishing to an invalid topic as child', async () => {
      const expectedError: string = 'Error: Invalid topic. This service does not contain a topic called invalidTopic';
      context = await expose(services, [testPubSubChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);
      const promise = callServiceFromChild(childIFrame, 'publishInvalid', 'response');
      await expectAsync(promise).toBeResolvedTo(expectedError);
    });

    it('Should forward errors of a service implementation from publish called as child', async () => {
      const expectedError: string = 'Error: Error in publish implementation.';
      throwError = true;
      context = await expose(services, [testPubSubChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);
      const promise = callServiceFromChild(childIFrame, 'publish', 'response');
      await expectAsync(promise).toBeResolvedTo(expectedError);
    });

    it('Should unsubscribe with observable as child', async () => {
      context = await expose(services, [testPubSubChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);
      const expectedValue: string = 'de';

      await callServiceFromChild(childIFrame, 'subscribe', 'langChanged');
      await callServiceFromChild(childIFrame, 'publish', 'response');
      await callServiceFromChild(childIFrame, 'unsubObservable', 'response');
      await callServiceFromChild(childIFrame, 'publish', 'response');

      const newValue = (childIFrame.contentDocument?.getElementById('langChanged') as HTMLInputElement).value;
      expect(newValue).withContext('Value should not be changed after unsubscription.').toBe(expectedValue);
    });

    it('Should unsubscribe with callService as child', async () => {
      context = await expose(services, [testPubSubChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);
      const expectedValue: string = 'de';

      await callServiceFromChild(childIFrame, 'subscribe', 'langChanged');
      await callServiceFromChild(childIFrame, 'publish', 'response');
      await callServiceFromChild(childIFrame, 'unsubCallService', 'response');
      await callServiceFromChild(childIFrame, 'publish', 'response');

      const newValue = (childIFrame.contentDocument?.getElementById('langChanged') as HTMLInputElement).value;
      expect(newValue).withContext('Value should not be changed after unsubscription.').toBe(expectedValue);
    });

    it('Should return an error when unsubscribing an invalid topic as child', async () => {
      const expectedError: string = 'Error: Invalid topic. This service does not contain a topic called invalidTopic';
      context = await expose(services, [testPubSubChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);

      const response = await callServiceFromChild(childIFrame, 'unsubscribeInvalid', 'response');
      expect(response).toBe(expectedError);
    });

    it('Should forward errors of a service implementation from unsubscribe called as child', async () => {
      const expectedError: string = 'Error: Error in unsubscribe implementation.';
      throwError = true;
      context = await expose(services, [testPubSubChild]);
      const childIFrame = (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement);
      const promise = callServiceFromChild(childIFrame, 'unsubCallService', 'response');
      await expectAsync(promise).toBeResolvedTo(expectedError);
    });

    it('Should return Observable instead of BehaviourSubject from subscribe method. New value publish should only be possible via callService', async () => {
      context = await expose(services, []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const observable: any = await context.callService({ id: 'languageService', version: '0.0.0' }, 'subscribe', ['languageKey']);
      expect(() => observable.next()).toThrow(new TypeError('observable.next is not a function'));
    });
  });

  describe('CallService request - response tests', () => {
    const services: Array<Service> = [
      {
        id: 'notification',
        version: '0.0.0',
        impl: (method: string, args: Array<unknown>) => {
          switch (method) {
            case 'notify':
              return serviceImplMock.impl(args[0] as string);
            default:
              throw new Error('Invalid method was called ' + method);
          }
        }
      }
    ];
    const serviceImplMock = { impl: (msg: string) => { return msg; } };

    const servicesDifferentResponseTypes: Array<Service> = [
      {
        id: 'normal-response',
        version: '0.0.0',
        impl: (_method: string, _args: Array<unknown>) => { return 'frame: normal response'; }
      },
      {
        id: 'promise-response',
        version: '0.0.0',
        impl: async (_method: string, _args: Array<unknown>) => {
          // Return after 1 seconds
          return await new Promise<string>((resolve) => {
            setTimeout(() => resolve('frame: promise response'), 1000);
          });
        }
      },
      {
        id: 'import-script-response',
        version: '0.0.0',
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        impl: async (_method: string, _args: Array<unknown>) => {
        }
      }
    ];

    let context: Context | null;

    beforeEach(() => {
      spyOn(serviceImplMock, 'impl').and.callThrough();
    });

    afterEach(() => {
      context = null;
      // Remove child from container
      const container = document.getElementById('davinci-mfo-container');
      if (container) {
        container.innerHTML = '';
      }
    });

    it('Should forward errors of a service implementation called as parent', async () => {
      const invalidMethod: string = 'invalidMethod';
      const expectedError: Error = new Error('Invalid method was called ' + invalidMethod);

      context = await expose(services, []);
      const promise = context.callService({ id: 'notification', version: '0.0.0' }, invalidMethod, []);
      await expectAsync(promise).toBeRejectedWith(expectedError);
    });

    it('Should execute methods registered in own services array when calling', async () => {
      context = await expose(services, []);
      const msg: string = 'this is a frame message';
      await context.callService({ id: 'notification', version: '0.0.0' }, 'notify', [msg]);
      expect(serviceImplMock.impl).toHaveBeenCalledOnceWith(msg);
    });

    it('Should execute method of frame when calling from child', async () => {
      context = await expose(services, [testChild]);
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      await callServiceFromChild(childIFrame, 'notify', 'response');
      const msg: string = 'this is a child message';
      expect(serviceImplMock.impl).toHaveBeenCalledWith(msg);
    });

    it('Should execute method of frame when calling from child immediately after expose', async () => {
      const msg: string = 'this is a child message';

      context = await expose(services, [testChild]);
      await delay(0);
      expect(serviceImplMock.impl).toHaveBeenCalledWith(msg);
    });

    it('Should forward errors of a service implementation called as child', async () => {
      const invalidMethod: string = 'invalidMethod';
      const expectedError: string = 'Error: Invalid method was called ' + invalidMethod;

      context = await expose(services, [testChild]);
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const promise = callServiceFromChild(childIFrame, 'errorService', 'response');
      await expectAsync(promise).toBeResolvedTo(expectedError);
    });

    it('Should execute method of frame when calling from grandchild', async () => {
      context = await expose(services, [testGrandChild]);
      await delay(150);
      const grandChildIFrame: HTMLIFrameElement =
        (document.getElementsByTagName('iframe')[0] as HTMLIFrameElement).contentDocument?.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      await callServiceFromChild(grandChildIFrame, 'notify', 'response');
      const msg: string = 'this is a child message';
      expect(serviceImplMock.impl).toHaveBeenCalledWith(msg);
    });

    it('Should return normal response (without promise)', async () => {
      const frameResponse: string = 'frame: normal response';
      context = await expose(servicesDifferentResponseTypes, [testServicesChild]);
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const promise = callServiceFromChild(childIFrame, 'normal-response', 'response');
      await expectAsync(promise).toBeResolvedTo(frameResponse);
    });

    it('Should return promise response', async () => {
      const frameResponse: string = 'frame: promise response';
      context = await expose(servicesDifferentResponseTypes, [testServicesChild]);
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const promise = callServiceFromChild(childIFrame, 'promise-response', 'response');
      await expectAsync(promise).toBeResolvedTo(frameResponse);
    });

    xit('Should return import script response', async () => {
      const frameResponse: string = 'import script response';
      context = await expose(servicesDifferentResponseTypes, [testServicesChild]);
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const promise = callServiceFromChild(childIFrame, 'import-script-response', 'response');
      await expectAsync(promise).toBeResolvedTo(frameResponse);
    });
  });

  describe('Style Synchronization Tests', () => {

    const services: Array<Service> = [];
    let context: Context | null;
    const originalHeadHtml = document.head.innerHTML;

    afterEach(() => {
      context = null;
      // Remove child from container
      const container = document.getElementById('davinci-mfo-container');
      if (container) {
        container.innerHTML = '';
      }
      document.head.innerHTML = originalHeadHtml;
    });

    xit('should style a child with the variables from the parent', async () => {  // FIXME: find a solution to test without breaking multi origin contexts
      document.head.innerHTML = document.head.innerHTML +
        `
      <style>
      :root {
        --css-test-variable: rgb(255, 0, 0);
      }
    </style>
      `;
      await expose(services, [testStyleSyncChild]);
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const styleSyncTesteeElement = childIFrame.contentDocument?.getElementById('style-sync-testee');
      if (!!styleSyncTesteeElement) {
        const value = getComputedStyle(styleSyncTesteeElement).getPropertyValue('background-color');
        expect(value).toEqual('rgb(255, 0, 0)');
      } else {
        fail('no styleSyncTesteeElement found');
      }
    });

    it('should overwrite the style of a child on overwriteCssVariables(cssVariables)', async () => {
      context = await expose(services, [testStyleSyncChild]);
      const stylesMap = new Map();
      stylesMap.set('--css-test-variable', 'rgb(0, 255, 0)');
      context.overwriteCssVariables(stylesMap);

      await delay(0);
      const childIFrame = document.getElementsByTagName('iframe')[0] as HTMLIFrameElement;
      const styleSyncTesteeElement = childIFrame.contentDocument?.getElementById('style-sync-testee');
      if (!!styleSyncTesteeElement) {
        const value = getComputedStyle(styleSyncTesteeElement).getPropertyValue('background-color');
        expect(value).toEqual('rgb(0, 255, 0)');
      } else {
        fail('no styleSyncTesteeElement found');
      }

    });
  });

  xdescribe('calling service directly tests', () => {

    // it('call service directly', async () => {
    //   const context = await expose([], [testServicesChild]);
    //   context.getChild(context.getDescendants()[0])?.child.callServiceDirectly({ id: 'normal-response', version: '0.0.0' });
    // });

  });

  xdescribe('Lazy loading services tests', () => {

    it('Should not load a service before it is called', () => {
      expect(true).withContext('not implemented').toBeFalse();
    });

    it('Should execute an implementation correctly when lazy loaded', () => {
      expect(true).withContext('not implemented').toBeFalse();
    });

  });

});

describe('Utils function tests', () => {

  it('Should return right method types', () => {
    const subscribe = getMethodType('subscribe');
    expect(subscribe).toBe(MethodType.SUBSCRIBE);

    const publish = getMethodType('publish');
    expect(publish).toBe(MethodType.PUBLISH);

    const unsubscribe = getMethodType('unsubscribe');
    expect(unsubscribe).toBe(MethodType.UNSUBSCRIBE);

    const notify = getMethodType('notify');
    expect(notify).toBe(MethodType.OTHER);
  });

  it('Should convert service identification in correct format', () => {
    const serviceIdent: ServiceIdentification = { id: 'language', version: '1.0.0' };
    const serviceIdentStr: string = convertServiceIdentificationToString(serviceIdent);
    const expectedServiceIdentStr: string = 'id:language,version:1.0.0';
    expect(serviceIdentStr).toBe(expectedServiceIdentStr);
  });

  it('Should return subscription id in correct format', () => {
    const serviceIdent: ServiceIdentification = { id: 'language', version: '1.0.0' };
    const subscriptionId: string = getSubscriptionId(serviceIdent, 'languageKey');
    const expectedSubscriptionId: string = 'id:language,version:1.0.0,topic:languageKey';
    expect(subscriptionId).toBe(expectedSubscriptionId);
  });

  it('Should return service identification and topic from subscription id in correct format', () => {
    const expectedServiceIdent: ServiceIdentification = { id: 'language', version: '1.0.0' };
    const expectedTopic: string = 'languageKey';
    const subscriptionId: string = 'id:language,version:1.0.0,topic:languageKey';
    const { serviceIdent, topic } = getServiceIdentificationFromSubscriptionId(subscriptionId);
    expect(serviceIdent).toEqual(expectedServiceIdent);
    expect(topic).toBe(expectedTopic);
  });

  it('Should return service identification and topic from subscription id in correct format', () => {
    const expectedServiceIdent: ServiceIdentification = { id: 'language', version: '1.0.0' };
    const serviceIdentStr: string = 'id:language,version:1.0.0';
    const serviceIdent: ServiceIdentification = convertStringToServiceIdentification(serviceIdentStr);
    expect(serviceIdent).toEqual(expectedServiceIdent);
  });

});

const delay = async (timeInMs: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeInMs);
  });
};

/**
 * Triggers the callService method from a child and returns its response
 *
 * @param iframe - the iframe of the child
 * @param buttonId - the if of the button that should be clicked
 * @param inputId - the id of the input, were the change is tracked
 * @returns - response of the callService method
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async
const callServiceFromChild = (iframe: HTMLIFrameElement, buttonId: string, inputId: string): Promise<string> => {
  const iframeContent: Document = iframe.contentDocument as Document;
  const button: HTMLButtonElement = iframeContent.getElementById(buttonId) as HTMLButtonElement;
  const input: HTMLInputElement = iframeContent.getElementById(inputId) as HTMLInputElement;
  return new Promise((resolve) => {
    input.addEventListener('change', () => {
      const response: string = input.value;
      resolve(response);
    });
    button.click();
  });
};

