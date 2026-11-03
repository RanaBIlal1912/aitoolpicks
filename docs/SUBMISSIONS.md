# Tool submissions: how they work and the alternatives

## Today

The form on `/submit/` checks the entry in the browser (required fields, https addresses, duplicates against the catalog, a hidden spam trap), then opens a **pre-filled issue** in this public GitHub repository using the template `.github/ISSUE_TEMPLATE/submit-tool.yml`. The visitor presses "Submit new issue" on GitHub, so a **free GitHub account is required**. The site itself stores nothing and holds no secrets. A person reviews every issue against the product's official pages.

Added in this phase: bare addresses such as `acme.com` get `https://` added, an error summary lists every problem with links to the fields, a note appears when the pricing page is on a different site from the website, a "Copy details as text" button keeps what was typed, and a step-by-step confirmation explains that nothing has been sent until GitHub's button is pressed.

## Options for a submission that needs no GitHub account

None is set up. This is an evaluation, not a recommendation to add one now. Terms and free limits of third-party services change, so check each service's current page before choosing.

| Option | Needs a server of ours | Secret in the frontend | Notes |
| --- | --- | --- | --- |
| **GitHub issue (current)** | No | No | Public, visible status, nothing lost. Needs a GitHub account. |
| **`mailto:` link** | No | No | Works with no account. Opens the visitor's email app, so it fails for people who use webmail only, and the address is public (spam). Set `NEXT_PUBLIC_CONTACT_EMAIL` to switch the contact page to it; the submit page then mentions it. |
| **Hosted form service** (a service that receives the POST and emails it to you) | No (theirs) | A form ID that is public by design, not a secret | No account for the visitor, private. Adds a third party that receives visitors' data, so the privacy policy must name it. Spam control and free limits vary by service. |
| **Small serverless function** with a bot check, storing to a private place | Yes (a function we would host and maintain) | Keys live in the function's environment, never in the page | Most control, and the most to maintain and secure. Not justified at current volume. |

**Recommendation.** Keep GitHub issues as the main route. If you want a no-account route, the lowest-effort honest one is a public contact email set through `NEXT_PUBLIC_CONTACT_EMAIL` (no code change). Only add a hosted form service if submissions actually arrive that GitHub is blocking, and update `/privacy/` first.
