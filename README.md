# Bible Game Night

A two-team Bible quiz for church, built as a static site (no build step).

## Run it
Open `index.html` in a browser, or host it on GitHub Pages:
1. In the repo, go to Settings > Pages and set Source to **GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/pages.yml` publishes the
   site (you can also run it by hand from the Actions tab).

## Edit questions
All questions live in `questions.js`. Each section has an example and a pool.
Each game draws questions at random from the pool, so add more for variety.
Picture questions use images in `images/` (`image: "images/your-file.jpg"`),
with an optional `clue` caption shown underneath. The included pictures are
from Wikimedia Commons; `images/CREDITS.md` lists authors and licences (keep
it with the site). Emoji clues (`emoji: "🐋"`) still work too.

## Moderator controls
- Correct / Wrong buttons, or keys C / W. Space pauses the timer.
- Wrong or time-out passes a bonus attempt to the other team.
- Small +/- buttons next to each score fix mistakes (on the board screen).
- "Answer key" on the board shows the answers for the current section.
- Progress is saved in the browser; "New game" clears it.
