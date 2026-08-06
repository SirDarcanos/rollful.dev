---
title: Reading a result
description: What each field of a Rollful roll means, and why the dropped dice are reported.
sidebar:
  order: 1
---

Every response reports each group of dice separately, so you can show the working rather
than only the answer.

```json
{
  "formula": "4d6kh3",
  "dice": [
    {
      "sides": 6,
      "sign": 1,
      "results": [5, 4, 5, 3],
      "kept": [5, 5, 4],
      "keptFlags": [true, true, true, false],
      "multiplier": 1,
      "total": 14,
      "naturalHigh": false,
      "naturalLow": false
    }
  ],
  "modifier": 0,
  "modifiers": [],
  "total": 14,
  "advantageState": "normal"
}
```

## The die groups

| Field         | Meaning                                                                      |
| ------------- | ---------------------------------------------------------------------------- |
| `sides`       | how many faces these dice have                                               |
| `sign`        | `1` or `-1`, whether the group adds to or subtracts from the total           |
| `results`     | every die rolled, in the order rolled, including the ones that were dropped  |
| `kept`        | the dice that counted, highest first                                         |
| `keptFlags`   | aligned to `results`: whether each die counted                               |
| `multiplier`  | what the kept dice were multiplied by, `1` unless the formula said otherwise |
| `total`       | this group's signed contribution to the total                                |
| `naturalHigh` | the one kept die showed its highest face                                     |
| `naturalLow`  | the one kept die came up 1                                                   |

### Why both `kept` and `keptFlags`

`kept` tells you which values counted. `keptFlags` tells you which _dice_ counted, and that
is not the same thing.

Roll `6d6kh3` and get `[5, 4, 5, 3, 6, 1]`. `kept` is `[6, 5, 5]` — but two of the three
dice showing 5 and 6 survived and one 5 did not, and `kept` alone cannot say which. Because
`keptFlags` lines up with `results` one for one, it can:

```
results    [5,    4,     5,    3,     6,    1   ]
keptFlags  [true, false, true, false, true, false]
```

That is what lets an interface strike through the die that was dropped where it was rolled,
rather than printing the survivors again underneath.

### `naturalHigh` and `naturalLow`

Both are set only when a group kept exactly one die. A top face among several dice is not a
critical on its own, and reporting it as one would be this library deciding something it has
no business deciding.

## The roll

| Field            | Meaning                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `formula`        | the formula as it was given, with whitespace trimmed                  |
| `dice`           | one entry per group of dice                                           |
| `modifier`       | the sum of the flat modifiers; dice are not counted here              |
| `modifiers`      | each flat modifier separately, in order                               |
| `total`          | the answer                                                            |
| `advantageState` | `normal`, `advantage` or `disadvantage`                               |
| `tag`            | the trailing tag, when the formula carried one the request recognises |

`modifiers` is a list rather than a single number so that `+1 -6` can be shown as it was
written. Their sum of `-5` is true but says nothing about where the numbers came from.

## What is not reported

A result records what the dice showed, never where the numbers came from. That is
deliberate: it means a result cannot carry a claim about its own fairness that you would
have to take on trust.

The package accepts an injectable random source for testing. **The API does not expose it,
and never will.** A caller-chosen source would let anyone pick their own results while the
response still looked honest.
