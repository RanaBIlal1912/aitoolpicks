# Audit checklist (2026-10-30)

Labels: **COMPLETE AND VERIFIED** (works and was checked), **IMPLEMENTED, NEEDS MANUAL VERIFICATION**, **PARTIAL**, **BLOCKED**.

## Directory and search
- Local task search with match reasons (`src/lib/search.ts`) .......... COMPLETE AND VERIFIED (unit tests on the example queries; UI checked in the in-app browser)
- Filters: multi-category, subcategory, pricing model, free, paid, trial, open source, verified, price ceiling, sort, load more .......... COMPLETE AND VERIFIED
- Semantic (AI) search .......... NOT BUILT (the function shape is ready to swap; no AI service is configured)
- Trending tools .......... BLOCKED: there is no usage data, and we do not invent popularity. "Recently added" and "Free plan" sections are shown instead

## Tool pages
- Alternatives with reasons and differences, plus `/tools/<id>/alternatives/` .......... COMPLETE AND VERIFIED
- Favorites, Recently viewed (localStorage, no sync) .......... IMPLEMENTED, NEEDS MANUAL VERIFICATION on a real browser profile (logic is unit-tested; storage was exercised in the in-app browser)
- Comparison of 2 to 3 tools, differences marked, shareable link .......... COMPLETE AND VERIFIED
- Submit a tool .......... PARTIAL: validated form that opens a pre-filled public GitHub issue; private submissions need a backend (not set up)

## Content
- Pricing: 60 tools; see `npm run catalog` for current verified/partial/unverified counts .......... COMPLETE AND VERIFIED (0 unverified; partial records are labelled with the reason)
- News magazine, RSS, per-story pages .......... COMPLETE AND VERIFIED
- Blog separate from news; 10 topics, 23 guides .......... PARTIAL: freelancing is 7 of 23 guides; more guides on models, infrastructure, workflows and tutorials are still to write
- Reviews .......... PARTIAL: 5 documentation-based overviews; no hands-on review exists; template in `docs/REVIEW_TEMPLATE.md`
- Ecosystem discovery .......... BLOCKED on data, see `docs/ECOSYSTEM.md`

## Platform
- Lighthouse, desktop 92 to 100, mobile 48 to 88 (see `docs/LIGHTHOUSE.md`) .......... PARTIAL: mobile performance needs server-rendered cards
- Physical-device testing .......... NOT DONE
