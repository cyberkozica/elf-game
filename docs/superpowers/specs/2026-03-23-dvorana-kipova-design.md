# Design: Dvorana kipova

**Datum:** 2026-03-23
**Status:** Odobreno

---

## Pregled

Novi nivo koji se ubacuje između `RuinsScene` i `HeartScene`. Tamena kamena dvorana s četiri Enta raspoređena u mrežu 2×2. Tri su kipovi (brončani, srebrni, zlatni), jedan je pravi drveni Ent. Igrač mora pronaći pravog — ako odabere krivog, vraća se u Ruins i mora ponoviti slagalicu.

---

## Scena i atmosfera

- Naziv scene: `StatueScene` (ključ: `'Statue'`)
- Naziv u igri: `DVORANA KIPOVA`
- Vizualni stil: ista paleta kao `RuinsScene` (sivi kamen, tamnoplava pozadina), s dekorativnim stupovima uz lijevi i desni rub (bez physics blockera — `physics.world.setBounds` je dovoljno)
- Igrač ulazi s lijeve strane (x≈40, y=160), izlaz su zaključana vrata desno (x>460)
- Nova runa: **ᛈ** (Perthro), boja `#cd7f32` (brončana)

---

## Raspored Entova

Četiri Enta u mreži 2×2 u sredini dvorane:

```
[Ent A ~185,110]  [Ent B ~295,110]
[Ent C ~185,210]  [Ent D ~295,210]
```

- Svi izgledaju identično pri ulasku: drveni, tamnosmeđi, oči zatvorene (spavaju)
- Pravi Ent odabire se nasumično (`Phaser.Utils.Array.Shuffle`) svaki put kad scena počne
- Ostala tri su kipovi: materijali `bronze`, `silver`, `gold` raspoređeni nasumično po preostalim pozicijama

---

## Hint mehanika

- Nakon **60 sekundi** od ulaska u scenu, pravi Ent dobiva **suptilno plavo sjajenje očiju** — implementirati pozivom `realEnt.setHintGlow(true)` (vidi Ent.js izmjene)
- Sjajenje je stalno (nije trepćuće), ostaje aktivno dok igrač ne odabere ili napusti scenu
- Kipovi nemaju ovaj efekt

---

## Interakcija — pravi Ent

1. Igrač pritisne **E** unutar 60 px od pravog Enta
2. Runa **ᛈ** se pojavi na tlu pokraj Enta i auto-collect (isti obrazac kao ostali nivoi)
3. StatueScene postavlja `this._transitioning = true` (isti guard kao u svim ostalim scenama) da spriječi dvostruko okidanje
4. Vrata se otključaju, igrač izlazi u `HeartScene` pritiskom na desni rub (x>460)
5. **Nema `_entSpokenAfterRune` gateа** — izlaz je gated samo s `rune.isCollected()` i `_transitioning`

---

## Interakcija — krivi Ent (kip)

1. Igrač pritisne **E** unutar 60 px od krivog Enta
2. Dramatična sekvenca:
   - **Svi četiri** Enti se kratko zatresu (Phaser tween: x offset ±3, trajanje 80ms, 3 ponavljanja)
   - `revealMaterial()` se poziva **samo na tri kipa** (ne na pravom Entu):
     - brončani: `0xcd7f32`
     - srebrni: `0xc0c0c0`
     - zlatni: `0xffd700`
   - Pravi Ent ostaje drveni — **`revealMaterial()` se ne poziva na njemu**
   - `DialogBox` prikazuje: `"Kažnjen si vraćanjem u ruševine!"`
3. Nakon 2500ms:
   ```js
   this.scene.start('Ruins', { runes: this.collectedRunes, fromStatue: true });
   ```
   `this.collectedRunes` nije mutiran u wrong-choice putu (ᛈ se ne pushuje). Nema potrebe za klonom.
4. Runa ᛈ **nije** prikupljena

---

## Ponovni ulazak u StatueScene s već prikupljenom ᛈ

Ako `this.sys.settings.data?.runes?.includes('ᛈ')` pri `create()`, scena odmah otvara vrata. U normalnom toku igre ovo se ne može dogoditi.

---

## Povratak u RuinsScene (`fromStatue: true`)

RuinsScene čita flag **u `create()`** iz `this.sys.settings.data`, konzistentno s time kako već čita `runes`:

```js
// U create():
this.collectedRunes = this.sys.settings.data?.runes ?? [];
this._fromStatue = this.sys.settings.data?.fromStatue ?? false;
```

`this._fromStatue` se sprema kao instance varijabla jer `_updateEnt()` koji se poziva iz `update()` treba pristup flagy po završetku `create()`.

Puzzla se automatski resetira jer `scene.start()` rekonstruira scenu i `create()` uvijek stvara novi `new PuzzleState()`.

---

## Najava iz Ruins Enta

Kad `!this._fromStatue`, sleeping Ent pri prvom E-pritisku:
```
'"...zzz... stari stupovi... pamte red... Moj prijatelj u dvorani iza voli kipove. Ali pazite — nije sve što stoji, živo... zzz..."'
```

Kad `this._fromStatue === true`, sleeping Ent pri prvom E-pritisku:
```
'"...zzz... stari stupovi... pamte red... zzz..."'
```

---

## RuinsScene — izmjena Ent dijalogu i tranzicije

U `_updateEnt()`, grana kad je runa prikupljena:
```js
// Staro:
'"Srce šume te čeka na istoku."'
// Novo:
'"Dvorana kipova te čeka na istoku."'
```

`_entSpokenAfterRune` flag i logika postavljanja ostaju **nepromijenjeni**.

U `_checkExit()`:
```js
// Staro:
this.scene.start('Heart', { runes: this.collectedRunes });
// Novo:
this.scene.start('Statue', { runes: this.collectedRunes });
```

---

## HeartScene — izmjene za 7 runa

```js
// Staro:
const ringRunes  = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᚷ'];
const ringAngles = [0, 60, 120, 180, 240, 300];
// Novo:
const ringRunes  = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᛈ', 'ᚷ'];
const ringAngles = [0, 51, 103, 154, 206, 257, 309];
```

`_updateRingGlow` — zamijeniti `allRunes`:
```js
// Staro:
const allRunes = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᚷ'];
// Novo:
const allRunes = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᛈ', 'ᚷ'];
```

`_updatePortal` — zamijeniti `allCollected` check:
```js
// Staro:
const allCollected = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᚷ'].every(r => this.collectedRunes.includes(r));
// Novo:
const allCollected = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᛈ', 'ᚷ'].every(r => this.collectedRunes.includes(r));
```

Popraviti komentar `// 5 runes on the ring` → `// 7 runa na prstenu`.

---

## HUD — izmjene za 7 slotova

Zadržati postojeći **17px step** (15px slot + 2px razmak). 7 × 17 = 119px span — stane u panel od 132px.

Umetnuti ᛈ na poziciju 5 (između ᚹ i ᚷ):
```js
// Staro:
const symbols = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᚷ'];
const colors  = ['#ffcc44', '#ff8844', '#44cc66', '#ff4488', '#44ccee', '#ffffff'];
// Novo:
const symbols = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᛈ', 'ᚷ'];
const colors  = ['#ffcc44', '#ff8844', '#44cc66', '#ff4488', '#44ccee', '#cd7f32', '#ffffff'];
```

Komentar u konstruktoru: `// Rune slotovi (6 runa: ᚱ ᚠ ᛩ ᛜ ᚹ ᚷ)` → `// Rune slotovi (7 runa: ᚱ ᚠ ᛩ ᛜ ᚹ ᛈ ᚷ)`

Loop gornja granica: `i < 6` → `i < 7`

---

## Ent.js — novi API za materijalne varijante

Konstruktor dobiva opcionalni četvrti argument `options`:
```js
new Ent(scene, x, y)                          // default — wood, nepromijenjeno
new Ent(scene, x, y, { material: 'bronze' })
new Ent(scene, x, y, { material: 'silver' })
new Ent(scene, x, y, { material: 'gold' })
```

Postojeći pozivi bez četvrtog argumenta ostaju kompatibilni (default `material: 'wood'`).

Dodati `this._bodyColor = null` u konstruktoru. U `_draw()`, zamijeniti hardcoded boju tijela:
```js
// Staro:
this.graphics.fillStyle(awake ? 0x2a1a05 : 0x1a1208);
// Novo:
const bodyHex = this._bodyColor ?? (this.awake ? 0x2a1a05 : 0x1a1208);
this.graphics.fillStyle(bodyHex);
```

**`revealMaterial(hex)`** — postavlja `this._bodyColor = hex`, poziva `this._draw()`:
```js
revealMaterial(hex) {
  this._bodyColor = hex;
  this._draw();
}
```

**`setHintGlow(active)`** — upravlja zasebnim Graphics objektom (`this.glowGraphics`) koji se kreira u konstruktoru odmah nakon `this.graphics`:
```js
// Konstruktor:
this.glowGraphics = scene.add.graphics();
// setHintGlow:
setHintGlow(active) {
  this.glowGraphics.clear();
  if (active) {
    this.glowGraphics.fillStyle(0x4488ff, 0.5);
    this.glowGraphics.fillRect(this.x - 8, this.y - 30, 6, 6);
    this.glowGraphics.fillRect(this.x + 2, this.y - 30, 6, 6);
  }
}
```

---

## Tehničke izmjene — sažetak

| Datoteka | Izmjena |
|----------|---------|
| `src/scenes/StatueScene.js` | Nova datoteka — cijela scena; `_transitioning` guard |
| `src/objects/Ent.js` | Opcioni `{ material }` u konstruktoru; `this._bodyColor`; `revealMaterial(hex)`; `this.glowGraphics`; `setHintGlow(active)` |
| `src/ui/HUD.js` | Loop `i < 7`; komentar; dodati ᛈ i `#cd7f32` u arrays |
| `src/scenes/HeartScene.js` | `ringRunes`, `ringAngles`, `allRunes` (×2), `allCollected` — sve na 7 elemenata; komentar |
| `src/scenes/RuinsScene.js` | `this._fromStatue` iz `sys.settings.data`; Ent dijalog (×2 varijante); tranzicija → `'Statue'` |
| `src/main.js` | Import i registracija `StatueScene` |

---

## Tok scene (sažetak)

```
RuinsScene (riješena slagalica)
  └→ StatueScene
       ├→ Pravi Ent odabran → HeartScene (sa 7 runa)
       └→ Krivi Ent odabran → RuinsScene (fromStatue:true, puzzle reset, rune zadržane)
```

---

## Rune — novi poredak (7 ukupno)

| # | Runa | Boja (HUD) | Scena |
|---|------|------------|-------|
| 1 | ᚱ | `#ffcc44` | ForestScene |
| 2 | ᚠ | `#ff8844` | LakeScene |
| 3 | ᛩ | `#44cc66` | CaveScene |
| 4 | ᛜ | `#ff4488` | StairsScene |
| 5 | ᚹ | `#44ccee` | RuinsScene |
| 6 | ᛈ | `#cd7f32` | StatueScene *(nova)* |
| 7 | ᚷ | `#ffffff` | HeartScene |
