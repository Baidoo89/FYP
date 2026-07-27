# Text to paste into "Approved FYP.docx"

This file is not a chapter on its own — it contains two short additions to paste directly into your existing Word document. Neither changes your approved scope; both strengthen citations/honesty of what's already there.

---

## Addition 1 — Chapter 2, end of §2.5 "Review of Existing Systems (GCTU Context)"

Paste this as a new paragraph immediately after §2.5.1 "Existing GCTU Promotion Process" (or at the end of §2.5, before §2.5.5 "University of Ghana Promotion Process" — either location works):

> GCTU's Heads of Academic Departments Handbook (2025) provides additional detail beyond the Basic Laws on how academic promotion is actually assessed. It confirms that evaluation proceeds through four levels — self-assessment by the applicant, assessment by the Head of Department, assessment by the Faculty Appointments and Promotions Sub-Committee (FAPC), and final assessment by the University Appointments and Promotions Committee (UAPC) — with each level rating the applicant's Teaching, Promotion of Knowledge, and Service as "Excellent," "Very Good," "Good," "Satisfactory," or "Unsatisfactory." Minimum requirements differ by target rank: for example, promotion to Senior Lecturer requires either "Excellent" in Teaching and Promotion of Knowledge with at least "Satisfactory" in Service, or "Good" in all three areas (Ghana Communication Technology University, 2025). This confirms that GCTU's real promotion assessment is a qualitative, multi-level human judgement process, which informs the scope boundary described in §1.8: the proposed system supports this process with verified evidence and a rule-based recommendation rather than attempting to replicate the full qualitative assessment cascade.

**New reference to add to your reference list** (alphabetised with your existing GCTU entries):

> Ghana Communication Technology University (2025) *Heads of Academic Departments Handbook*. Accra: GCTU.

---

## Addition 2 — Chapter 5 (or wherever your final "Recommendations / Future Work" content lives)

If Chapter 5 in your Word document is still a placeholder, this paragraph is already included in full in `docs/chapter5-implementation.md` §5.7, item 1. If you'd rather add just this one paragraph by hand without using that full chapter file, paste this:

> The current eligibility engine determines a score from which required evidence categories (Teaching, Research, Service) have been verified as present, using fixed institutional weights. This is a deliberate simplification of GCTU's actual promotion assessment, which — per the Heads of Academic Departments Handbook (2025) — involves the Head of Department, Faculty Appointments and Promotions Committee, and University Appointments and Promotions Committee each independently rating an applicant's Teaching, Promotion of Knowledge, and Service as Excellent, Very Good, Good, Satisfactory, or Unsatisfactory. Future work could extend the system with a structured interface for reviewers to record these qualitative ratings and apply GCTU's actual per-rank combination rules, rather than the current document-completeness proxy.

---

### Why these two additions and not more

Both are citation/honesty additions, not scope changes — they don't require touching the approved objectives, functional requirements, or delimitations already in Chapters 1–3, and they don't require any further code changes. They're the kind of thing a supervisor or panel member reads as "this student understands the real institutional process and can explain exactly where their prototype simplifies it," which is a stronger position than either ignoring the simplification or trying to rebuild the system around it this late.
