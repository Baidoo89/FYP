# Benjamin Baidoo Defence Pack

This folder contains the presentation artifacts for the final defence of **Design and Implementation of a Digital Staff Promotion Support System for GCTU**.

## Files

- `GCTU_Promotion_System_Defence_Benjamin_Baidoo.pptx` - 11-slide presentation with speaker notes.
- `GCTU_Promotion_System_Defence_Benjamin_Baidoo.pdf` - offline fallback with the same 11 slides.
- `defence-slides-contact-sheet.png` - visual review sheet for the full deck.
- `GCTU_FYP_Defence_Team_Master_Brief_Benjamin_Baidoo.docx` - editable team handbook covering the report, implemented software, examiner questions, demonstration, and team responsibilities.
- `GCTU_FYP_Defence_Team_Master_Brief_Benjamin_Baidoo.pdf` - print-ready 36-page copy of the team handbook.

All generated PowerPoint, Word, and PDF deliverables are also copied to the current user's Downloads folder.

## Regenerate

```powershell
node scripts/create-defence-presentation.js
npm run defence:team-brief
```

The presentation generator renders each slide at 1920 by 1080, builds the PowerPoint and PDF, creates the contact sheet, and refreshes the Downloads copies. The team-brief command regenerates the handbook from `docs/defence-team-master-brief.md` and refreshes its Word and PDF copies in Downloads.

## Prepare the application demonstration

```powershell
npm run defence:prepare
npm run defence:check
npm run db:health
npm run defence:live-check
```

The demonstration uses representative data for Benjamin Baidoo. It is not an official staff record.
