import { match, when, exhuastive, reduceMatchers } from "./";
import type {
  MatcherArrToTuples,
  Matcher,
  MergeTuple,
  MatchResult,
  GuardedType,
  FilterTuple,
  TupleToMatcher,
  Matchers,
} from ".";

// ------test util---------------------

type Expect<a extends true> = a;
type Equal<a, b> = (<T>() => T extends a ? 1 : 2) extends <T>() => T extends b
  ? 1
  : 2
  ? true
  : false;

//----------

// test
type __ = [
  Expect<
    Equal<
      MatcherArrToTuples<
        [
          Matcher<(v: unknown) => v is 1, (v: 1) => 100>,
          Matcher<(v: unknown) => v is 2, (v: 2) => 200>
        ]
      >,
      [[1, 100], [2, 200]]
    >
  >,
  Expect<Equal<MergeTuple<[[1, 100], [2, 200]]>, [1 | 2, 100 | 200]>>
];
// how to use -----------------------------------------
const is =
  <const N extends unknown>(n: N) =>
  (v: unknown): v is N =>
    v === n;

declare const v: 1 | 2 | "a" | "b";
const result = match(
  v,
  when(is(1), (v) => 100 as const),
  when(is(2), (v) => 200 as const),
  reduceMatchers(
    when(is("a"), (v) => "aaa" as const),
    when(is("b"), (v) => "bbb" as const)
  )
);
switch (result.type) {
  //^?
  case "matched":
    const value = result.then;
    //^?
    break;
  case "else":
    const narrowedInput = result.else;
    //^?
    break;
  default:
    const _unreachable: never = result;
}
// unrwap matched or throw error
const aa = exhuastive(result);
//^?
{
  const is =
    <const N extends unknown>(n: N) =>
    (v: unknown): v is N =>
      v === n;
  const matchers = [
    when(is(1), (v) => 100 as const),
    when(is(2), (v) => 200 as const),
    when(is(3), (v) => 666600 as const),
    reduceMatchers(
      when(is("a"), (v) => "aaa" as const),
      when(is("b"), (v) => "bbb" as const),
      when(is("c"), (v) => "ccc" as const)
    ),
  ] as const;

  type ReturnTypeOfMatcher<I, M extends Matcher<any, any>> = M extends Matcher<
    infer Pred,
    infer Then
  >
    ? MatchResult<Exclude<I, GuardedType<Pred>>, ReturnType<Then>>
    : never;

  const input = "input" as const;
  type ___ = [
    Expect<
      Equal<
        ReturnTypeOfMatcher<typeof input, Matcher<any, any>>,
        MatchResult<Exclude<typeof input, GuardedType<any>>, ReturnType<any>>
      >
    >,
    Expect<Equal<GuardedType<any>, never>>,
    Exclude<typeof input, unknown>
  ];

  type MatcherArr_ = typeof matchers;
  type Tuple = MatcherArrToTuples<MatcherArr_>;

  type Tuple_ = FilterTuple<Tuple, 1 | 2>;
  type Merged = MergeTuple<Tuple_>;
  type _Matcher = TupleToMatcher<Merged>;
  type _Matcher2 = Matchers<MatcherArr_>;
}
