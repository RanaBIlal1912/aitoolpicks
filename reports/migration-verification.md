# Catalogue migration verification

- Result: **PASS**
- Checked: 2026-11-03T13:15:22.596Z
- Database: 127.0.0.1  |  repository commit: 448167b

| Check | Result | Detail |
| --- | --- | --- |
| 1. counts: database equals the files | pass | companies 65, categories 15, subcategories 36, tools 69, toolCategoryLinks 113, alternatives 172, pricingPlans 288, toolSources 139, affiliatePrograms 15 |
| 1b. counts: files equal the Phase 1 audit | pass | no change since the audit |
| 2. round trip: every tool exports to its original JSON | pass | 69 tools identical |
| 2b. round trip: categories and subcategories | pass | 15 categories identical, same order |
| 2c. round trip: affiliate programmes | pass | 15 identical |
| 3. relationships: every tool has a company, a primary category in its category list, plans and sources | pass | primary category missing 0, company missing 0, no plans 0, no sources 0 (foreign keys are enforced by the database itself) |
| 3b. every imported tool is published with a date | pass | 0 not published |
| 4. slugs: tool slugs equal the tool ids in the files | pass | 69 slugs identical |
| 6. affiliate: statuses equal the files, no link exists, nothing is approved unless the files say so | pass | links 0, approved 0 (files: 0) |
| 7. counts: content groups equal the files | pass | models 9, modelToolLinks 12, articles 30, comparisons 2, reviews 17, newsItems 17, newsToolLinks 18, newsImages 6, roundups 6, roundupPicks 29, redirects 32 |
| 8. round trip: models, same content and same order | pass | 9 identical |
| 8. round trip: articles (HTML body included), same content and same order | pass | 30 identical |
| 8. round trip: comparisons, same content and same order | pass | 2 identical |
| 8. round trip: reviews, same content and same order | pass | 17 identical |
| 8. round trip: news items (images included), same content and same order | pass | 17 identical |
| 8. round trip: roundups and picks, same content and same order | pass | 6 identical |
| 8. round trip: legacy redirects, same content | pass | 32 identical |
| 9. reviews: every review is documentation and none has a testing record | pass | non-documentation 0, testing rows 0 |
| 9b. every tool's review link points at its own review | pass | 0 broken |
| 9c. every imported item is published with a date | pass | 0 not published |
| 9d. information: article bodies containing a script tag (they are sanitised when edited, decision D-13) | pass | 0 |

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
| models | 9 | 9 |
| modelToolLinks | 12 | 12 |
| articles | 30 | 30 |
| comparisons | 2 | 2 |
| reviews | 17 | 17 |
| newsItems | 17 | 17 |
| newsToolLinks | 18 | 18 |
| newsImages | 6 | 6 |
| roundups | 6 | 6 |
| roundupPicks | 29 | 29 |
| redirects | 32 | 32 |

Not covered by this report (later steps): media assets, site settings, render parity of the 320 pages.
