# Catalogue migration verification

- Result: **PASS**
- Checked: 2026-11-03T13:00:27.673Z
- Database: 127.0.0.1  |  repository commit: 564c8b7

| Check | Result | Detail |
| --- | --- | --- |
| 1. counts: database equals the files | pass | companies 65, categories 15, subcategories 36, tools 69, toolCategoryLinks 113, alternatives 172, pricingPlans 288, toolSources 139, affiliatePrograms 15 |
| 1b. counts: files equal the Phase 1 audit | pass | no change since the audit |
| 2. round trip: every tool exports to its original JSON | pass | 69 tools identical (reviews link excluded until reviews are imported) |
| 2b. round trip: categories and subcategories | pass | 15 categories identical, same order |
| 2c. round trip: affiliate programmes | pass | 15 identical |
| 3. relationships: every tool has a company, a primary category in its category list, plans and sources | pass | primary category missing 0, company missing 0, no plans 0, no sources 0 (foreign keys are enforced by the database itself) |
| 3b. every imported tool is published with a date | pass | 0 not published |
| 4. slugs: tool slugs equal the tool ids in the files | pass | 69 slugs identical |
| 6. affiliate: statuses equal the files, no link exists, nothing is approved unless the files say so | pass | links 0, approved 0 (files: 0) |

## Counts

| Item | Files | Database |
| --- | ---: | ---: |
| companies | 65 | 65 |
| categories | 15 | 15 |
| subcategories | 36 | 36 |
| tools | 69 | 69 |
| toolCategoryLinks | 113 | 113 |
| alternatives | 172 | 172 |
| pricingPlans | 288 | 288 |
| toolSources | 139 | 139 |
| affiliatePrograms | 15 | 15 |

Not covered by this report (later steps): reviews, articles, comparisons, news, roundups, models, media, redirects, render parity of the 320 pages.
