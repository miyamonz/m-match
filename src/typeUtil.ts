export type GuardedType<T> = IsAny<T> extends true
  ? never
  : T extends (x: any) => x is infer U
  ? U
  : never;
export type IsNever<T> = [T] extends [never] ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
