# Murdoku — Reverse-Engineering Notes (reference only)

Analysis of the public data format, produced 2026-09-05. **Mechanics and schema only.**
Do not copy their puzzle instances, layouts, clue sets, hint text, or art assets — those are
authored work. Build our own content on our own schema.

---

## 1. Delivery architecture

Fully static. No backend, no database. React + Vite build.

| Path | Purpose | Size |
|---|---|---|
| `/play_puzzles/_puzzleCatalog.json` | Index of all puzzles | small |
| `/play_puzzles/en/puzzle-<slug>-<difficulty>.json` | **Master file** — geometry, solution, everything | ~92 KB |
| `/play_puzzles/<lang>/puzzle-<slug>-<difficulty>-<lang>.json` | Translation overlay — text only | ~3 KB |
| `/play/assets/obj_<name>-<hash>.svg` | Object sprites | small |
| `/play/assets/texture_<name>-<hash>.svg` | Floor textures | small |

**Key idea worth adopting:** one heavy master file + tiny per-language overlays.
This is why they support 23 languages at near-zero cost.

### Catalog entry shape

```json
{
  "id": "puzzle-discord-island-medium",
  "difficulty": "medium",
  "gridSize": "9x9",
  "file": "puzzle-discord-island-medium.json",
  "suspects": 9,
  "category": "secret",
  "releaseAt": "2025-07-07T01:00:00.000Z",
  "title_en_": "...", "title_ar_": "...", "title_fr_": "..."
}
```

Catalog held 64 puzzles at time of analysis.

---

## 2. Master file schema

Four top-level objects. All values are **strings**, mostly `"%f"`-formatted floats
(`"16.000000"`). Keys are flat — indices are baked into key names, never nested arrays.
This strongly suggests export from a game engine's data table.

### PROPERTIES

| Key | Example | Meaning |
|---|---|---|
| `grid_w`, `grid_h` | `16` | grid dimensions |
| `cellsize` | `101` | pixel size of one cell |
| `grid_rx`, `grid_ry` | `1660`, `680` | pixel origin of grid top-left |
| `total_chars`, `total_char` | `16` | number of characters |
| `total_rooms_` | `14` | number of rooms |
| `murderer` | `9` | **index of the murderer** |
| `difficulty` | `2` | difficulty tier |
| `clue_0`, `clue_1` | `101`, `102` | **IDs of global rules from a fixed catalog** |
| `clue_custom_text1..3` | prose | human wording of those global rules |
| `player_hint_1_en` … `_7_en` | prose | full human deduction chain |
| `solution_text_<LANG>_0..7` | prose | short per-step solution summary |
| `grid_theme`, `grid_objets_theme` | | art theme selectors |
| `victimcard_visible`, `instructions_in_white` | | UI flags |

### GRID

Per **room** (`N` = room index):
- `room_name_N`
- `room_name_xpos_N`, `room_name_ypos_N` — label placement
- `room_color_xpos1_N`, `room_color_xpos2_N`, `room_color_ypos1_N`, `room_color_ypos2_N`
- `room_color_0_N`, `room_color_1_N` — packed 24-bit ints
- `room_color_sat_0_N`, `room_color_sat_1_N`
- `room_floortex_N`, `room_class_medieval_N`
- `room_subroom_N`, `room_subroom_mainroom_N`

Per **cell** (`C` = column, `R` = row, both 0-based):
- `room_code_C_R` — **which room this cell belongs to**
- `room_objects_C_R` — object id in the cell (`0` = none)
- `room_objects_frame_C_R` — sprite variant (`-1` = none)
- `carpet_objects_C_R`, `carpet_objects_frame_C_R` — floor decoration layer

> Note the ordering: **column first, then row.** Easy to get backwards.

### CHARACTERS

Per character `i`:
- Identity: `char_name_i`, `char_sex_i`, `char_theme_i`, `char_class_i`
- **Procedural avatar:** `char_body_i`, `char_skincolor_i`, `char_hair_i`, `char_haircolor_i`,
  `char_facial_i`, `char_accessory_i`, `char_clothes_i`, `char_clothescolor_i`, `char_hat_i`
- Clues: `char_quote_<lang>_i` and `char_subquote_<lang>_i` (second line, often unused)
- **Position:** `letter_xpos_i`, `letter_ypos_i` — in pixels

Characters are never drawn by hand. Thirteen numbers assemble a person at render time.
That is how ~1000 characters exist with no art budget.

### OBJECT

`obj_color_0_N` and `obj_color_1_N` for N up to ~135 — per-instance recoloring of shared sprites.

---

## 3. Decoding the solution

Positions are stored as pixel coordinates, not grid indices:

```js
const col = Math.floor((letter_xpos - grid_rx) / cellsize);
const row = Math.floor((letter_ypos - grid_ry) / cellsize);
```

### Verification performed on `puzzle-the-zoo-expert` (16×16, 16 suspects)

- All 16 decoded rows unique ✓ and all 16 columns unique ✓ — confirms the Sudoku constraint.
- `murderer: 9` decoded to **Jim** — matches their own hint text "Jim is the murderer!" ✓
- Victim **Vlad** at R11 C12, Elephant Habitat. That room contains **exactly two** people,
  Vlad and Jim ✓ — confirms the "alone with the killer" rule defines the answer.
- Character 0 (Alfred) decoded to **R3 C7** — matches their hint text "(A) in R3 C7" exactly ✓

Decoder used:

```js
const P = json.PROPERTIES, G = json.GRID, C = json.CHARACTERS;
const num = v => parseFloat(v);
const n  = num(P.grid_w), cs = num(P.cellsize);
const rx = num(P.grid_rx), ry = num(P.grid_ry);

const roomOf = (row, col) => num(G[`room_code_${col}_${row}`]);

const chars = [];
for (let i = 0; i < num(P.total_chars); i++) {
  const col = Math.floor((num(C[`letter_xpos_${i}`]) - rx) / cs);
  const row = Math.floor((num(C[`letter_ypos_${i}`]) - ry) / cs);
  chars.push({
    i,
    name:  C[`char_name_${i}`],
    row, col,
    room:  G[`room_name_${roomOf(row, col)}`],
    quote: `${C[`char_quote_en_${i}`]} ${C[`char_subquote_en_${i}`]}`.trim(),
  });
}
const murderer = chars[num(P.murderer)];
```

---

## 4. The three things that make 16×16 solvable

A generator using only per-character clues fails at every size — verified experimentally.
What makes their large grids work:

1. **Global rules that constrain every character at once.** `clue_0`/`clue_1` are numeric IDs
   into a catalog of reusable rules. In the zoo puzzle they resolve to:
   - *"Everyone from Ivan to Vlad were zookeepers. Everyone else was a visitor.
     Only zookeepers could be in the Habitats."* — a class/region restriction
   - *"Each Habitat had at least one zookeeper."* — a covering constraint

   The first prunes the domain of eight characters simultaneously. The second forbids
   empty rooms, which drives most of the deduction chain.

2. **Many rooms.** 14 rooms across 256 cells. Each room is small, so "in room X" is a
   powerful statement. Compare 4 rooms on a 5×5, where it barely narrows anything.

3. **`char_subquote`** — a second sentence on the same card when one fact is not enough.
   The card count stays at one per suspect; the fact count does not.

---

## 5. Difficulty is proven, not estimated

Every puzzle ships `player_hint_1..N`: a complete human deduction chain written in a fixed
vocabulary — **block** (eliminate squares) and **isolate** (narrow to one square).

Verbatim example of the style:

> "(E) can only be beside a table in R10 C14, this isolates (E). This isolates (G),
> sitting in a chair alone on the Deck. Block the rest of the Deck."

The implication is the important part: **their puzzles are solvable by pure constraint
propagation — no guessing, no backtracking.** That is both their validity criterion and
their difficulty measure.

Consequence for our engine: we do not need to enumerate solutions. We need a propagator
that runs to a fixed point and checks whether every character is pinned. That is fast even
at 16×16, and the propagation trace *is* the hint chain — generated for free, where they
appear to write theirs by hand.

---

## 6. What we take and what we don't

**Take (ideas, not expression):**
- Static-file delivery with a master file plus thin translation overlays
- Cell-indexed room map, procedural characters, recolorable shared sprites
- Global-rule catalog addressed by numeric id
- Propagation-solvable as the publication gate, with an auto-generated hint chain

**Do not take:**
- Their puzzle instances — layouts, solutions, clue sets
- Their hint and story text
- Their SVG art
- Their character and room names

Their map *is* their puzzle: every clue refers to specific cells in a specific layout.
Reskinning a stolen layout is not a shortcut, and changing the layout invalidates every
clue anyway. Either way, a generator is required. Build it.
