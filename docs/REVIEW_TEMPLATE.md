# Review template

Two kinds of review exist, and they must never be confused.

| Label | What it means | Allowed claims |
| --- | --- | --- |
| **Documentation-based overview** (all current reviews) | Written from the vendor's official pages and the facts in `content/tools`. No one ran the tool for this page. | What the vendor says the product does, its published plans and limits. **No** claims about speed, quality, accuracy or personal experience. |
| **Hands-on tested** | A named person used the product on real tasks on stated dates and recorded the results. | Only what that testing showed, with the method and dates stated on the page. |

Do not label a review "hands-on tested" until the testing log below is complete. Do not publish scores, stars or rankings.

## Structure of every review

1. **What it does:** one paragraph, from the vendor's own description.
2. **Who it is for / who should skip it.**
3. **Main strengths** and **limitations** (from the record; for hands-on reviews, from the test).
4. **Ease of use** (hands-on only; omit for documentation-based pages).
5. **Pricing and restrictions:** the plans table from the tool page, in the vendor's currency, with the checked date and region.
6. **Alternatives:** three tools from the same category, with a link to the compare page.
7. **Method and date:** one honest sentence. Documentation-based: "We read X's official pages on DATE; we did not test the product." Hands-on: see below.

## Hands-on testing log (required before the "Hands-on tested" label)

- Tester name and role:
- Product and plan tested (name, price paid or free tier), account region:
- Dates tested (start to end) and total hours:
- Tasks run (list 3 to 5 real tasks, each with the input and what was produced):
- What worked, with examples:
- What failed or needed manual fixing, with examples:
- Anything the vendor claims that you could not reproduce:
- Data and privacy settings you checked:
- Screenshots taken by the tester (only these may be shown; they are the tester's own):
- Conflicts of interest (affiliate link configured? free account from the vendor?):

## Page fields (implemented in `src/data/reviews.ts`, rules in `src/lib/review-trust.ts`)

Every review has a required `method`: `"documentation"` (shown as "Editorial research") or `"hands-on"` (shown as "Hands-on tested"). Optional `reviewer` names who wrote a documentation page; it defaults to "AI Tool Picks editors".

A `"hands-on"` review must also carry a `testing` record, and `tests/review-trust.test.ts` fails the build if any field is missing or false:

| Field | Rule |
| --- | --- |
| `testedBy`, `role` | A named person and their relationship to the product |
| `plan`, `region` | The plan used (and whether it was paid) and the account region |
| `testedFrom`, `testedTo` | Real dates, not in the future, in order; `hours` optional |
| `tasks` | At least one task, each with what was run and what it produced |
| `worked`, `failed` | Both required: say what worked and what failed or needed fixing |
| `notReproduced` | Optional: vendor claims that could not be reproduced |
| `conflicts` | An explicit statement, even if it is "None" |
| `evidence` | At least one item with a label (https address if it is online) |
| `screenshots` | Optional; the tester's own, in `public/`, each with alt text and a caption |

A `"documentation"` review must **not** have a `testing` record. The page header shows the label, the writer or tester, and the date the underlying facts were last checked (the tool record's verified date, not the site's last build). No review shows a score, stars or a rating, and no structured data claims one.
