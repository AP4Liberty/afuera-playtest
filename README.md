# Full Four-Level Playable Build

This is the first production browser build of *¡AFUERA! — Chainsaw of Liberty*.

## Run locally

From the repository root:

```powershell
python -m http.server 4173 --directory game
```

Open `http://127.0.0.1:4173/`.

## Controls

- Move: WASD or arrow keys
- Light attack: J
- Heavy attack: K
- Dodge: Space
- ¡AFUERA! special: L when the LIBERTAD meter is full
- Touch controls appear automatically on mobile devices
- Pause: P; mute: M (or use the on-screen buttons)

## Implemented

- Real Calle Corrientes environment and source-derived character art
- Four Calle Corrientes scenes that advance across the encounter sequence
- Four-frame Milei walk cycle with depth scaling and synchronized footsteps
- Accelerated movement, progressive braking, distance-driven animation timing, and eased enemy pursuit
- Scene-specific walkable floor bounds that keep characters on streets and interior platforms
- Compact translucent mobile controls that preserve visibility during combat
- Milei action poses for light attack, heavy attack, dodge, and ¡AFUERA!
- Eight-direction beat-em-up movement plane
- Light combo, heavy attack, dodge, hit reactions, knockback, and invulnerability frames
- LIBERTAD meter and screen-wide ¡AFUERA! attack
- Five standard enemy archetypes with distinct health, speed, damage, and behaviors
- Alternate movement poses for all five standard enemy archetypes
- Hit-stop, combo callouts, damage numbers, and enemy defeat feedback
- Decaying-peso drops, collection, Tax Collector theft, score, and HUD
- El Gremialista, Evita, and Juan Perón encounters
- El Gremialista charge attack, Evita ranged attacks, and Perón decree shockwaves
- Visible damage numbers for hits taken and dealt
- Short Level 1 opening story card
- Non-blocking entrance lines for all three Level 1 bosses
- Dedicated boss name, health, and phase HUD
- Crowd-spacing logic that reduces enemy sprite stacking
- Level-clear cutscene transition into the Dollarization Shop
- Telegraph rings for boss attacks and Perón reinforcement summons
- Breakable street props with peso rewards
- Procedural arcade sound effects generated in the browser
- Procedural retro combat music generated in the browser
- Dollarization Shop conversion with persistent damage, health, and meter upgrades
- Local save data for dollars, upgrades, and best score
- Desktop and mobile-responsive presentation
- Win, loss, replay, wave, and boss states
- Level 2 Ministry of Bureaucracy environment and five-wave encounter sequence
- Alphabet Agency enemy movement set
- Three-phase Mecha-FDR fight with missile barrages and agency summons
- Level 1 Dollarization Shop handoff into Level 2
- Level 2 intro and victory cutscene
- Level 3 University of Marx environment and five-wave encounter sequence
- Three-phase Che Guevara's Ghost motorcycle encounter
- Level 3 intro, victory cutscene, and Dollarization Shop handoff
- Level 4 Kremlin Reactor environment and five-wave final gauntlet
- Kremlin Technician enemy movement set
- Three-form Super Stalin finale: base, exo-armor, and full mecha
- Lightning, charge, missile, and reinforcement phases
- Final victory and ending sequence
- Golden Chainsaw double-damage, Invisible Hand invulnerability, and healing Mate power-ups with timed HUD feedback
- Boss attack labels, charge posing, projectile trails, phase-change bursts, screen treatment, and stronger impact feedback
- True consecutive-hit streaks plus C/B/A/S wave ranks based on speed and damage taken, with score bonuses and arcade callouts
- Saved campaign progression with a four-level select screen, locked-stage states, continue behavior, and direct testing links
- One-time, non-blocking Liberty Intel cards that teach combos, guard breaks, priority enemies, boss tells, and resource strategy during play
- Persistent local Hall of Liberty with ranked level-clear records, final-score classification, and a post-credits return to the campaign menu
- Full pause menu with resume, safe level restart, campaign return, and automatic pause when the browser loses visibility
- Level-specific arena hazards: slowing Ministry red tape, pulsing University propaganda fields, and telegraphed Kremlin electrical vents
- Standard gamepad support with analog movement, full combat mapping, menu-button pause, and an automatic connection guide
- Stronger enemy identity: visible Professor buff auras, Clipboard block feedback, and Tax Collectors that steal, flee, display their haul, and drop it when caught
- Subtle hero-driven background parallax and level-specific ambient particles: city glints, drifting forms, campus flyers, and reactor sparks
- Four distinct procedural music patterns with faster boss arrangements, layered bass/percussion, and mobile/controller rumble for combat impacts
- Six capped Dollarization Shop upgrade paths with canonical tier pricing, escalating costs, immediate gameplay effects, and one-step purchase refunds
- SNES-style one-life/two-continue structure with encounter restarts, retained upgrades and score, a 20% unbanked-peso penalty, HUD tracking, and game over flow
- Primer Paso, Libertad, and completion-unlocked Motosierra difficulty presets affecting damage, tells, aggression, peso decay, speed, scoring, and leaderboard records
- Perfect-dodge timing window with melee evasion, projectile deflection, hit-stop feedback, LIBERTAD gain, and a 750-point skill bonus
- Complete eight-branch upgrade tree with Creative Destruction heavy shockwaves and capped, once-per-shop Compound Interest
- Installable landscape PWA with generated home-screen icons, full asset manifest, service-worker updates, and offline campaign caching
- Native install prompt, installed-state handling, offline/online status messaging, local-save reassurance, and service-worker update checks
- Persistent player options for audio, ambient motion/parallax, screen shake, and mobile/controller haptics
- Risk/reward score multiplier that grows through clean hit streaks and perfect dodges, boosts combat and wave bonuses, and breaks on damage
- Skippable illustrated story scenes for the dog theft, Rand warning, live-dog reveal, Hoppe betrayal, reactor kennel, Marx possession, homecoming, and post-credits tease
- Adam Smith shop introduction and cinematic transitions that pause and safely resume play

## Asset pipeline

Run `tools/build_assets.py` to regenerate the game derivatives from the preserved Higgsfield originals. Source files are never overwritten.

## Next production pass

The current build now records a compact field report after every cleared mission: combat time, damage taken, perfect dodges, peak multiplier, recovered pesos, and final score. Results persist with local score records.

The Hall of Liberty turns those records into per-level personal bests and six replay honors, including no-damage clears, perfect-dodge mastery, full multiplier, peso recovery, and campaign completion.

Combat-feel polish now includes short attack lunges, forgiving buffered follow-up attacks, eight-way directional dodges, three visually distinct saw-chain strikes, velocity-matched walk cadence, and grounded footstep particles so rapid inputs connect cleanly without returning to the old gliding motion.

External review builds can use `?playtest=1` to expose all four levels and Motosierra difficulty immediately, without requiring a reviewer to clear the campaign in sequence.

In playtest mode, the pause menu includes **Copy Test Report**. It copies the build number, level, encounter, difficulty, elapsed time, score, health, viewport, browser, and note prompts so reviewer feedback arrives with reproducible context.

Campaign progress now auto-saves after every cleared encounter. A seven-day resume checkpoint preserves the level, next encounter, difficulty, score, pesos, continues, and mission statistics; completing a mission or starting a new run clears it.

Reviewer mode now includes boss practice. It jumps directly to the selected level's final encounter, keeps practice results out of campaign records, and offers instant rematches for rapid pattern and difficulty testing.

Mobile presentation now includes fullscreen landscape play, safe-area-aware controls, low-opacity idle controls that brighten only while touched, and a compact portrait orientation hint.

The runtime now samples real frame pacing during combat. Sustained low frame rates automatically reduce particle density, while reviewer reports capture FPS, worst-frame time, dropped frames, and adaptive-mode status.

The campaign start is now asset-gated: all combat sprites and stage backgrounds preload with visible progress before play begins, preventing missing fighters or background pop-in on slower mobile connections.

Audio now has independent master, music, and combat-SFX controls. Chainsaw attacks use a layered synthesized motor sound with distinct light, heavy, and ¡Afuera! profiles instead of relying only on generic impact tones.

Crowd combat now uses difficulty-scaled attacker slots. Enemies that cannot safely enter the attack queue circle into flanking lanes instead of dogpiling simultaneously, improving readability without making the mob passive.

Combat inputs now buffer dodges through attack recovery, the third light hit lands as a readable combo finisher with extra damage and knockback, and breakable scenery can drop emergency health or temporary powers while awarding a destruction bonus.

Character rendering now anchors shadows beneath sprites instead of drawing them over the feet, synchronizes body bounce to actual walk frames, and adds subtle velocity lean to reduce the remaining gliding impression.

The HUD now shows encounter progress through each level. Installed and repeat-play builds also detect waiting service-worker releases and offer an explicit in-game update button, preventing surprise reloads during combat while keeping reviewers off stale versions.

Later encounters can now promote one standard enemy to an elite, with extra health, speed, damage, score, pesos, and a clear gold threat ring. Difficulty also scales enemy health, and critical player health now pulses visibly in the HUD.

Every playtest session now runs from a reproducible random seed. Copied reports include a one-click reconstruction URL so elite selection, drops, and encounter randomness can be recreated instead of diagnosed from vague descriptions.

Story scenes now unlock permanently in a visual Archives gallery. Players can revisit earned sequences without replaying levels, while unseen twists and ending material remain hidden until encountered naturally.

Every encounter now carries a rotating optional objective: no damage, speed clear, perfect dodge, or six-hit combo. Completing it awards a multiplier-scaled score bonus, LIBERTAD meter, dedicated audiovisual feedback, and mission-stat tracking.

Stage hazards now participate in combat: heavy attacks cut Ministry red tape for a deregulation bonus, while ¡Afuera! cancels University propaganda fields. Reactor vents remain indestructible timing hazards.

The Hall of Liberty now includes advanced honors for sweeping every bonus objective, clearing the Kremlin on Motosierra, and earning S rank across all four levels.

The inflation loop now reports loose currency and falling value directly in the HUD. Peso sprites visibly shift from green to gold to red, mission statistics track value destroyed by inflation, and sub-three-second collections earn escalating Sound Money bonuses.

Three new honors reward rapid peso recovery, near-zero inflation loss, and destroying multiple ideological stage hazards.

Touch controls now default to a substantially smaller compact footprint and can be switched back to the larger layout in Options. This preserves the low-opacity behavior while exposing more of the fight on small screens.

A deterministic Daily Challenge now selects one unlocked level from the calendar date, fixes Libertad difficulty and randomness for every player that day, limits the run to one continue, grants a 15% score bonus, survives checkpoints, and feeds three new daily honors.

Field reports now include a one-tap result copy for sharing rank, score, objective completion, and Daily Challenge status without exposing technical playtest details.

Playtest pause tools can now clear the current encounter instantly, allowing reviewers to traverse complete levels, transitions, shops, and result screens without grinding through every fight.

- Extract walk cycles, enemy attack frames, and boss animation states
- Expand boss-specific projectiles, charge paths, and cinematic phase transitions
- Add level scrolling, encounter gates, breakable props, and shop transition
- Add music, authored sound effects, and haptics
- Add deterministic gameplay tests and performance telemetry
