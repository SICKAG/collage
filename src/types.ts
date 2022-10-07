/**
 * This is why we can't have nice things.
 */

export type Optional<T> = T | null | undefined

export type Expose<IN, OUT> = (_?: IN) => Promise<OUT>

export type Plugin<Definition, Expected, Provided> =
  (_: Expose<unknown, Expected>) => Expose<Definition, Provided>

export type ArrangementApi = Record<string, CallableFunction>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FckTs = any
