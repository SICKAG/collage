/**
 * @copyright
 * Copyright(c) 2020 SICK AG
 */
import { Obj } from '../api/types';

type Predicate<T> = (x: [string, T]) => boolean;
type Mapper<T, U> = (x: [string, T]) => U;

/**
 * merges two objects
 *
 * @param a - first object
 * @param b - second object
 * @returns a merged object, combining the fields of a and b
 */
export function merge<T>(a: Obj<T>, b: Obj<T>): Obj<T> {
  return { ...a, ...b };
}

/**
 * returns an Array of arguments that can be used in Array.reduce calls.
 *
 * Specifically, the output of this function is intended to be used in reduces
 * of Arrays of Tuples (such which one gets from calling Object.entries on an
 * object) and reduces those into a new object.
 *
 * Example:
 * ```javascript
 * Object.entries({foo: 'foooooo', bar: 1234, baz: false})
 *   .filter(x => !!x)
 *   .map([name, value]=> [name, `${x}`])
 *   .reduce(...createObject())
 * ```
 *
 * will returns:
 * ```javascript
 * {
 *   foo: 'foooooo',
 *   bar: '1234'
 * }
 * ```
 *
 * @returns argumens for [].reduce to create an object from tuples
 */
export function createObject<T>(): [reduce: (p: Obj<T>, c: [string, T]) => Obj<T>, start: Obj<T>] {
  return [(object, [field, value]) => ({ ...object, [field]: value }), {}];
}

/**
 * Provides JS transform methods to typescript in a way that results in readable
 * operations, despite all the type schenanigans
 *
 * @param object - object to transform
 * @returns - an array of single field objects
 */
export function transform<T>(object: Obj<T> = {}): Array<[string, T]> {
  return Object.entries(object);
}

/**
 * Creates a mapper function that performs the mapper, given in 'then' when the
 * given predicate is true and the mapper goiven in 'else' otherwise.
 *
 * Example:
 * ```javascript
 * [1, 2, 3, 'four', 5]
 *   .map(when(x => typeof x === 'number')
 *     .then(x => `No. ${x}`)
 *     .else(x => x)
 *   )
 * ```
 *
 * will return:
 * ```javascript
 * ['No. 1', 'No. 2', 'No. 3', 'four', 'No. 5']
 * ```
 *
 * @param predicate - the condition on which to descide
 * @returns a mapper function
 */
export function when<T, U>(predicate: Predicate<T>):
  {then: (mapper: Mapper<T, U>) => { else: (elseMapper: Mapper<T, U>) => Mapper<T, U> }} {
  return {
    then(mapper) {
      return {
        else(elseMapper) {
          return (x: [string, T]) => (predicate(x) ? mapper : elseMapper)(x);
        },
      };
    },
  };
}

/**
 * Creates a predicate function for a tuple that matches the given predicate
 * against the value part (the right entry) of that tuple.
 *
 * To be used in map-reduce constructs of object-tuple arrays when you only
 * care about the value matching a certain predicate and not about the name.
 *
 * Example:
 * ```javascript
 * Object.entries({foo: 1, bar: 2, baz: 5})
 *   .filter(valueIs(n => !!(n % 2)))
 * ```
 *
 * will return:
 * ```javascript
 * [[foo, 1], [baz, 5]]
 * ```
 *
 * @param predicate - the predicate to match against the value
 * @returns a predicate for a tuple
 */
export function valueIs<T>(predicate: (x: T) => boolean): Predicate<T> {
  return ([, value]) => predicate(value);
}
