# Neon Brick Breaker: Cosmic Edition

A browser version of the Java Swing game (Advanced Java Programming, CSN302), built with plain HTML, CSS and JavaScript. No build step and no libraries.

**Team:** Aryan Bihari (1000024126), Aaddeep Biswas (1000025763), Vansh Minhas (1000024608)
**Submitted to:** Mr. Ravi Shankar Jha

## Controls
| Device | Move | Launch / pause | Other |
|---|---|---|---|
| Desktop | Arrow keys, A / D, or mouse | Space or click | R restart, M mute |
| Phone / tablet | Drag on the board | Tap | Buttons under the board |

Rotate a phone to landscape for a bigger board.

## Play it online with GitHub Pages
1. Create a new repository on GitHub (for example `brick-breaker`).
2. Upload everything in this folder (`index.html`, `style.css`, `script.js`, the `assets` folder, `README.md`). Keep `index.html` at the top level of the repository.
3. Open **Settings → Pages**. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose the `main` branch and the `/ (root)` folder, then save.
4. After a minute, the game is live at `https://<your-username>.github.io/<repository-name>/`. Open that link on any device.

## Run it on your computer
Double-click `index.html`. Everything works, but some browsers block the sound file when a page is opened straight from disk. For full sound, serve the folder instead:

```
python -m http.server 8000
```
then open http://localhost:8000.

## Files
- `index.html`: page and buttons
- `style.css`: layout and responsive scaling
- `script.js`: game logic, drawing, touch and keyboard input, sound
- `assets/boom.mp3`: brick-break sound
