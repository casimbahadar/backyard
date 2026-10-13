# Sticker Yard

A learning app for young children, built on the Ontario curriculum. A child plays short quests of reading and math questions. A quest with 70% or more right earns a sticker, and she places her stickers in a yard and seven other places she can decorate. Parents print matching worksheets, mark them in the app, and see results.

It runs in the browser on a phone, tablet or computer. There is no account, no server and no ads. Everything is kept in the browser on that device.

## What is in it

**Grades.** Kindergarten and Grade 1 (Grade 2 and up are shown as coming later).

**Skills.** 24 skills from the Ontario curriculum documents:

- *The Kindergarten Curriculum* (2026, published December 2025)
- *The Ontario Curriculum, Grades 1 to 8: Language* (2023)
- *The Ontario Curriculum, Grades 1 to 8: Mathematics* (2020, revised February 2024)

The skills cover letter sounds, first sounds, blending, reading and spelling short words, silent-e words, sight words, sentences, capitals and end marks, tracing letters, counting, comparing, number facts, patterns, shapes, sorting, measuring and money. Each skill names its curriculum code, and each pack file links to the Ministry page it was checked against.

**Noorani Qaida (optional).** Lessons 1 to 4: the single letters, joined letters, the muqatta'at, and the short vowels. A parent switches this on per child.

**Rewards.** A sticker needs at least 6 of 8 right in a quest. A perfect quest gives a shiny sticker. There are 259 stickers (plus 12 seasonal ones) and 8 places: Yard, Beach, Farm, Snowy woods, Under the sea, Outer space, Campsite and City park, plus 2 seasonal places. Stickers can be moved, resized and layered.

**Little books.** Ten short stories to read page by page. A book opens once she can read every word in it; tapping a word reads it aloud.

**Album and seasons.** A sticker album shows all 271 stickers, with the ones she has in colour. In Ramadan, at Eid, in winter and in her birthday week, the picker offers a seasonal sticker, and a Ramadan night or Birthday party place appears.

**Worksheets.** Every skill prints as one page of up to 10 questions, followed by a grown-up page that says what to read aloud and lists the answers. A parent types the sheet ID into Mark to record the score, and a sheet with 7 of 10 right earns a sticker too.

**Sound.** The device voice reads questions aloud by default. A parent can pick a nicer installed voice, or record their own. Letter sounds and the Arabic for the Qaida can also be recorded.

## Using it

**Children** tap their name, then Play. A quest is 8 questions.

**Grown-ups** tap Grown-ups in the yard and enter a 4-digit PIN. The PIN keeps children out; it is not a password.

| Tab | What it does |
| --- | --- |
| Kids | Add children; set grade, daily goal, birthday and which letter sounds they know; switch on the Noorani Qaida |
| Print | Choose a skill and print a worksheet |
| Mark | Enter a sheet ID and mark each answer right or wrong |
| Results | A weekly note (printable for a teacher), and progress per skill |
| Settings | Theme (Bright, Calm or Clear), voice, recordings, backup and restore |

**Recording** (Grown-ups, then Settings):

- *Your own voice:* 307 short pieces that the app joins into every question. The little books are read by the device voice.
- *Letter sounds:* 28 sounds. The blending game appears once all 28 are recorded.
- *Arabic for the Qaida:* 110 pieces, the letter names and each letter with fatha, kasra and damma.

Recordings stay on the device. "Save a file for another device" exports them, and "Load a file" imports them on another phone or tablet. To give every device a recorded voice, rename an exported voice file to `voice.json`, or a letter-sounds file to `clips.json`, and upload it to the repo, replacing the empty one. A device's own recordings take priority over these.

The microphone only works from the https address, such as the GitHub Pages link. It does not work from a file or from a local server on a phone.

## Setting it up

1. Upload every file to the root of a GitHub repository. The app has no folders.
2. In the repository settings, turn on GitHub Pages for the main branch.
3. Open the https address it gives you.

To check that questions and worksheets come out the same on a phone as on a computer, open `test-hash.html` on the phone. It should show **6b6beb19**. If it shows a different value, printed sheets would not mark correctly on that device.

## What the app keeps

The app keeps each child's first name, grade, results, stickers and the worksheets printed on that device, plus any recordings. They are stored in the browser on that device, and nothing is sent anywhere.

Every GitHub Pages site under one account shares the same browser storage area, so another app on the same github.io address could read this data. Settings explains this. Use Backup in Settings to save a copy.

## Files

| Files | What they are |
| --- | --- |
| `index.html`, `app.js`, `app.css` | The child screens |
| `parent.html`, `parent.js`, `parent.css` | The grown-up area |
| `on-k-language.json`, `on-k-math.json`, `on-1-language.json`, `on-1-math.json` | Ontario curriculum packs |
| `noorani.json`, `arabic.js` | The Noorani Qaida pack and its questions |
| `engine.js` and the other question files (`count-set.js`, `read-cvc.js`, `spell-cvc.js` and so on) | Build questions from a seed, so a printed sheet can be rebuilt for marking |
| `worksheet.js`, `sheet.css` | Printed worksheets |
| `stickers.js`, `stickers-*.js`, `pictures.js`, `places.js`, `scene.js` | Drawings |
| `books.js`, `seasons.js` | Little books, and the seasonal calendar and stickers |
| `audio.js`, `audio-store.js`, `voice.js`, `recorder.js` | Speech, sounds, recordings |
| `voice.json`, `clips.json` | Optional shipped recordings (empty to start) |
| `voice-pieces.json` | The list of voice pieces, built by `make-voice-list.mjs` |
| `test-*.mjs`, `test-*.js`, `test-hash.html` | Tests |
| `DECISIONS.md`, `TODO.md` | Design decisions and open tasks |

## Tests

The tests need Node and Playwright with Chromium. Run each from the repository root, for example `node test-generator.mjs`.

| Test | Checks |
| --- | --- |
| `test-packs.mjs` | Pack files against the curriculum rules |
| `test-generator.mjs` | Every skill's questions, about 26.7 million checks, in about 3 minutes |
| `test-rules.mjs` | Stars, stickers, mastery, the 70% rule, sticker offers |
| `test-flow.mjs` | A child's path through quests, stickers, places and spelling |
| `test-flow-print.mjs` | Every skill prints on one page and marks back correctly |
| `test-parent.mjs` | The grown-up area |
| `test-audio.mjs` | Voices, recorded voice and fallbacks |
| `test-recorder.mjs` | All three recorders, export and import |
| `test-ui-audit.mjs` | Layout, contrast and design checks in all three themes |

## Fonts and licences

The fonts are Andika, Fredoka and Noto Naskh Arabic. All three are under the SIL Open Font License, and their licence files are included.

No licence has been chosen yet for the app's own code and drawings.

## Notes on the content

The Ontario skills were checked against the official curriculum documents. The Noorani Qaida lesson order follows published Qaida guides, but the letters, names and English spellings in the app were written for it, and a quick check by someone who reads the Qaida is still worthwhile. Word lists and pictures were reviewed by the family who built it.
