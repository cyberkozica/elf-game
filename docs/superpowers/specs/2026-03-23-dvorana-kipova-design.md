# Design: Dvorana kipova (Dvorana kipova)

**Datum:** 2026-03-23
**Status:** Odobreno

---

## Pregled

Novi nivo koji se ubacuje između `RuinsScene` i `HeartScene`. Tamena kamena dvorana s četiri Enta raspoređena u mrežu 2×2. Tri su kipovi (brončani, srebrni, zlatni), jedan je pravi drveni Ent. Igrač mora pronaći pravog — ako odabere krivojg, vraća se u Ruins i mora ponoviti slagalicu.

---

## Scena i atmosfera

- Naziv scene: `StatueScene`
- Naziv u igri: `DVORANA KIPOVA`
- Vizualni stil: ista paleta kao `RuinsScene` (sivi kamen, tamnoplava pozadina), ali zatvorenija — stupovi uz lijevi i desni rub
- Igrač ulazi s lijeve strane, izlaz je zaključan desno sve dok ne odabere pravog Enta
- Nova runa: **ᛈ** (Perthro), boja `#CD7F32` (brončana)

---

## Raspored Entova

Četiri Enta u mreži 2×2 u sredini dvorane:

```
[Ent A]  [Ent B]
[Ent C]  [Ent D]
```

- Svi izgledaju identično pri ulasku: drveni, tamnosmeđi, oči zatvorene (spavaju)
- Pravi Ent odabire se nasumično svaki put kad igrač uđe u scenu
- Ostala tri su kipovi: jedan brončani, jedan srebrni, jedan zlatni (raspored nasumičan)

---

## Hint mehanika

- Nakon **60 sekundi** od ulaska u scenu, pravi Ent dobiva **suptilno plavo sjajenje očiju** (isto traje sve dok igrač ne odabere ili napusti scenu)
- Ostali Entovi nemaju taj efekt
- Nema vremenskog ograničenja — hint ostaje aktivan

---

## Interakcija — pravi Ent

1. Igrač pritisne **E** unutar 60 px od pravog Enta
2. Oči zasvijetle (potvrda), runa **ᛈ** se pojavi na tlu i auto-collect
3. Vrata se otključaju, igrač izlazi u `HeartScene`

---

## Interakcija — krivi Ent (kip)

1. Igrač pritisne **E** unutar 60 px od krivojg Enta
2. Dramatična sekvenca:
   - Svi četiri Enti se zatresu (kratka shake animacija)
   - Sva tri kipa odjednom pokažu svoj materijal (brončani → `#CD7F32`, srebrni → `#C0C0C0`, zlatni → `#FFD700`)
   - Pravi Ent ostaje drveni
   - `DialogBox` prikazuje: *"Kažnjen si vraćanjem u ruševine!"*
3. Nakon kratke pauze, igrač se vraća u `RuinsScene`
4. **Rune se zadržavaju** (ᛈ nije prikupljena jer je krivi Ent odabran)
5. **Ruins slagalica se resetira** — igrač mora ponovo riješiti 6-pillar puzzle da bi ušao natrag u Dvoranu

---

## Najava iz Ruins Enta

Ruins Ent pri **prvom posjetu** `RuinsScene` dobiva dodatnu rečenicu u dijalogu:
*"Moj prijatelj u dvorani iza voli kipove. Ali pazite — nije sve što stoji, živo."*

Ova najava se prikazuje samo prvi put (flag `ruinsEntFirstVisit`).

---

## Tehničke izmjene

| Datoteka | Izmjena |
|----------|---------|
| `src/scenes/StatueScene.js` | Nova datoteka — cijela scena |
| `src/objects/Ent.js` | Nove materijalne varijante: `bronze`, `silver`, `gold`, `wood-revealed`; plavo sjajenje očiju za hint |
| `src/ui/HUD.js` | 6 slotova → 7 slotova |
| `src/scenes/HeartScene.js` | Provjera s 6 → 7 runa za aktivaciju portala |
| `src/scenes/RuinsScene.js` | Tranzicija → `StatueScene` (umjesto `HeartScene`); Ent dijalog s najavom; reset slagalice kad dolazi iz `StatueScene` |
| `src/main.js` | Dodaje `StatueScene` u listu scena |

---

## Tok scene (sažetak)

```
RuinsScene (riješena slagalica)
  └→ StatueScene
       ├→ Pravi Ent odabran → HeartScene (sa 7 runa)
       └→ Krivi Ent odabran → RuinsScene (reset slagalice, rune zadržane)
```

---

## Rune — novi poredak

| # | Runa | Boja | Scena |
|---|------|------|-------|
| 1 | ᚱ | zlatna `#FFD700` | ForestScene |
| 2 | ᚠ | narančasta `#FF8C00` | LakeScene |
| 3 | ᛩ | zelena `#4CAF50` | CaveScene |
| 4 | ᛜ | ljubičasta `#9C27B0` | StairsScene |
| 5 | ᚹ | cijan `#00BCD4` | RuinsScene |
| 6 | ᛈ | brončana `#CD7F32` | StatueScene *(nova)* |
| 7 | ᚷ | bijela `#FFFFFF` | HeartScene |
