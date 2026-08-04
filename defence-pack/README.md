# Benjamin Baidoo Defence Pack

This folder contains the presentation artifacts for the final defence of **Design and Implementation of a Digital Staff Promotion Support System for GCTU**.

## Files

- `GCTU_Promotion_System_Defence_Benjamin_Baidoo.pptx` - 11-slide presentation with speaker notes.
- `GCTU_Promotion_System_Defence_Benjamin_Baidoo.pdf` - offline fallback with the same 11 slides.
- `defence-slides-contact-sheet.png` - visual review sheet for the full deck.

The PowerPoint and PDF are also copied to the current user's Downloads folder whenever the generator runs.

## Regenerate

```powershell
node scripts/create-defence-presentation.js
```

The source generator renders each slide at 1920 by 1080, builds the PowerPoint and PDF, creates the contact sheet, and refreshes the Downloads copies.

## Prepare the application demonstration

```powershell
npm run defence:prepare
npm run defence:check
npm run db:health
npm run defence:live-check
```

The demonstration uses representative data for Benjamin Baidoo. It is not an official staff record.
