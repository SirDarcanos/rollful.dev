---
title: The formula grammar
description: Every term a dice formula can carry, and how they combine — in the package and over HTTP alike.
sidebar:
  order: 1
---

A formula is written the way you would say it out loud. Terms combine freely, and anything
the parser does not recognise is an error rather than a guess — so a typo never quietly
becomes a different roll.

The grammar is OpenDice's, so it is the same whether you call `roll()` or
[the REST API](/docs/api/). The examples below are the package; over HTTP the formula is
the `formula` you send.

| Formula            | Meaning                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `2d6`              | roll two six-sided dice                                            |
| `1d20+7`, `10-1d4` | flat modifiers, added or subtracted                                |
| `2d20adv`          | advantage: roll two, keep the highest                              |
| `2d20dis`          | disadvantage: roll two, keep the lowest                            |
| `4d6kh3`           | keep the highest three                                             |
| `4d6kl3`           | keep the lowest three                                              |
| `1d6!`             | exploding: a top face rolls again and adds                         |
| `1d6!p`            | penetrating: like `!`, but each roll after the first counts 1 less |
| `1d6x10`           | multiply this group's total by ten                                 |
| `1d8+1d4+3`        | as many terms as you need                                          |
| `2d6 fire`         | a trailing tag, when the caller lists it                           |

## Advantage and disadvantage

`2d20adv` rolls two d20 and keeps the highest. The count says how many dice are thrown and
the suffix says that one of them survives, so the two are read separately: `4d20adv` throws
four d20 and keeps the best of the four. Every die comes back, not only the one that
counted, so an interface can show the dice that were dropped rather than hide them.

Write a count of at least two. `1d20adv` still rolls, and still rolls two dice, but one die
leaves the suffix nothing to choose between — it is deprecated, and a future version will
refuse it. `2d20adv` is the formula it means.

You can also ask for advantage without writing it into the formula, which is what you want
when the formula came from somewhere else:

```js
roll('2d20+7', { advantage: 'advantage' })
```

It applies to the first d20 term that does not already say `adv` or `dis`, keeping one die
out of however many that term throws. Net advantage and disadvantage yourself before asking:
what you pass is applied rather than reasoned about. Over HTTP the same value goes in the
request body's `advantage`.

## Keeping and dropping

`4d6kh3` rolls four dice and keeps the highest three — the usual way to roll an ability
score. `4d6kl3` keeps the lowest three instead.

A keep rule never keeps them all. If you ask to keep more dice than you rolled, you get the
dice you rolled.

## Exploding and penetrating

`1d6!` rolls again every time a die lands on its top face, and adds the whole chain. A die
of fewer than two sides never explodes, since every roll would be a top face.

`1d6!p` penetrates instead, which HackMaster uses: it explodes the same way, but every roll
after the first counts one less. The deduction comes off what the roll is worth rather than
off the face it landed on, so it never shortens a chain — a second roll showing a 6 on a d6
is recorded as 5 and still rolls again.

That has one consequence worth knowing: a penetrated 1 is recorded as `0`, which is the only
case `results` holds a number below 1.

Both are capped at 100 explosions per die, and neither combines with `kh`, `kl`, `adv` or
`dis`.

## Multipliers

`1d6x10` multiplies that group's total by ten. The multiplier binds to its own group, never
to the sum, so `1d6x10+5` is "ten times a d6, then add five" rather than "ten times
everything".

## Tags

A trailing word is a tag: `2d6 fire` rolls two d6 and carries `fire` back on the result.
Tags are metadata and never affect the arithmetic.

A tag only works if you list it first. Pass the words you recognise in `tags`:

```js
const result = roll('2d6 fire', { tags: ['fire'] })

result.tag // 'fire'
result.total // 6
```

Without that list, a trailing word is a parse error like any other stray token —
`roll('2d6 fire')` on its own throws. That is deliberate: an unrecognised word is far more
often a typo than a tag, and swallowing it would hide the mistake.

Over HTTP the same list goes in the request body's `tags`, which
[the endpoint](/docs/api/endpoints/operations/v1roll/post/) documents.
