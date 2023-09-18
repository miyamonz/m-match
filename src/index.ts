import type { GuardedType, IsNever } from "./typeUtil.js";

export type MatchResult<I = unknown, O = unknown> = Readonly<
  | {
      type: "matched";
      then: O;
    }
  | {
      type: "else";
      else: I;
    }
>;

export function when<
  const Pred extends (v: any) => v is unknown,
  const Then extends (matched: GuardedType<Pred>) => unknown,
>(pred: Pred, then: Then): Matcher<Pred, Then> {
  type Expected = GuardedType<Pred>;
  type Pred_ = (v: unknown) => v is Expected;

  type ThenValue = ReturnType<Then>;
  type Then_ = (matched: Expected) => ThenValue;

  return (<I>(v: I) => {
    type Else = Exclude<I, Expected>;

    if ((pred as Pred_)(v)) {
      const o = (then as Then_)(v);
      return {
        type: "matched",
        then: o,
      } as const satisfies MatchResult<Else, ThenValue>;
    } else {
      return {
        type: "else",
        else: v as Else,
      } as const satisfies MatchResult<Else, ThenValue>;
    }
  }) satisfies Matcher<Pred_, Then_>;
}

export type Matcher<
  Pred extends (v: any) => v is unknown,
  Then extends (matched: GuardedType<Pred>) => unknown,
> = <I>(v: I) => MatchResult<Exclude<I, GuardedType<Pred>>, ReturnType<Then>>;

// MatchersはMatcherをsatisfiesしている
export type Matchers<MatcherArr extends readonly Matcher<any, any>[]> = <I>(
  v: I,
) => MatcherArrToMatchResult<I, MatcherArr>;

type MatcherArrToMatchResult<
  I,
  MatcherArr extends readonly Matcher<any, any>[],
> = FilterAndMergeToMatcher<I, MatcherArr> extends Matcher<
  infer Pred,
  infer Then
>
  ? MatchResult<Exclude<I, GuardedType<Pred>>, ReturnType<Then>>
  : never;

type FilterAndMergeToMatcher<
  I,
  MatcherArr extends readonly Matcher<any, any>[],
> = TupleToMatcher<MergeTuple<FilterTuple<MatcherArrToTuples<MatcherArr>, I>>>;

type MatcherArrToTuples<
  MatcherArr extends readonly Matcher<any, any>[],
  Acc extends [unknown, unknown][] = [],
> = MatcherArr extends readonly [
  infer Head,
  ...infer Rest extends Matcher<any, any>[],
]
  ? // Matcher
    Head extends Matcher<(v: unknown) => v is infer I, (v: unknown) => infer O>
    ? MatcherArrToTuples<Rest, [...Acc, [I, O]]>
    : // Matchers
    Head extends Matchers<infer Inner>
    ? MatcherArrToTuples<[...Inner, ...Rest], Acc>
    : never
  : Acc;

type FilterTuple<
  Tuples extends readonly [unknown, unknown][],
  In,
  Acc extends [unknown, unknown][] = [],
> = Tuples extends [
  [infer I, infer O],
  ...infer Rest extends [unknown, unknown][],
]
  ? FilterTuple<
      Rest,
      In,
      IsNever<I & In> extends true ? Acc : [...Acc, [I & In, O]]
    >
  : Acc;

type MergeTuple<
  T extends readonly [unknown, unknown][],
  Acc extends [unknown, unknown] = [never, never],
> = T extends readonly [
  [infer I, infer O],
  ...infer Rest extends [unknown, unknown][],
]
  ? MergeTuple<Rest, [I | Acc[0], O | Acc[1]]>
  : Acc;

type TupleToMatcher<T extends [unknown, unknown]> = T extends [infer I, infer O]
  ? Matcher<(v: unknown) => v is I, (v: I) => O>
  : never;

export const match = <const Initial, MatcherArr extends Matcher<any, any>[]>(
  v: Initial,
  ...whens: MatcherArr
) => {
  const reduced = reduceMatchers(...whens);
  return reduced(v);
};

export function reduceMatchers<MatcherArr extends Matcher<any, any>[]>(
  ...matchers: MatcherArr
): Matchers<MatcherArr> {
  return (<I>(v: I) => {
    return matchers.reduce(
      (matchResult: MatchResult, matcher: Matcher<any, any>) => {
        if (matchResult.type === "matched") {
          return matchResult;
        } else {
          return matcher(matchResult.else);
        }
      },
      { type: "else", else: v },
    );
  }) as any;
}

export function exhuastive<O>(mr: MatchResult<never, O>): O {
  if (mr.type === "matched") {
    return mr.then;
  }
  throw new Error(`not matched`);
}
