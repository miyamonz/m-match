# m-match

A minimalistic pattern matching library for TypeScript.

## Installation

```sh
npm install m-match
```

## Usage

```ts
import { match, when, exhuastive } from "m-match";

declare const input: string | number | boolean;

const result = match(
  input,
  when(
    (v): v is string => typeof v === "string",
    (v) => `this is string. length:${v.length}` as const
  ),
  when(
    (v): v is number => typeof v === "number",
    (v) => `this is number. v: ${v}` as const
  )
);

switch (result.type) {
  case "matched":
    console.log(result.then);
    //                  ^? `this is string. length:${number}` | `this is number. v: ${number}`
    break;
  case "else":
    console.log(result.else);
    //                  ^? boolean
    break;
  default:
    result satisfies never;
    throw new Error("unreachable");
}

// exhuastive check
declare const input2: 1 | 2;
const result2 = match(
  input2,
  when(
    (v): v is 1 => v === 1,
    (v) => 111 as const
  ),
  when(
    (v): v is 2 => v === 2,
    (v) => 222 as const
  )
);
const unwrapped = exhuastive(result2);
//     ^? 111 | 222
// if input is more broad, exhuastive will throw error
```
