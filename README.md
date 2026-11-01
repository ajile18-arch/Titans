# Titans of Steel: Reborn

A modern web-based tactical mech strategy remake inspired by **Titans of Steel** / **Titans of Steel: Warring Suns**, built with a modular HTML5/CSS/JS architecture that can run directly in any browser or be packaged into a standalone desktop executable.

## Core Modules (Mode A: Classic Sim Baseline)

1. **HQ & Jockey Management (`js/hq.js`)**
   - **6 Classic Attributes:** Constitution, Intelligence, Instinct, Reflexes, Piloting, and Bravery (`100 XP` per point).
   - **10 Granular 0–100% Skills:** Energy Weapons, Cannons/Ballistic, Guided Missiles, Close Combat, Recon/Scanner, Damage Control, Leadership, Survival, Mechanic (Repair), and Medical (First Aid) (`50 XP` per `+5%`).
   - **Custom Jock Creator:** Customize First/Last Name, Callsign, Visor/Helmet Portrait, and Service Dossier Bio.
   - **Mercenary Hiring Hall & Crew Support:** Recruit new Jocks, assign Titans, and use Squad Mechanic/Medical skills for Hangar repairs and pilot recovery.

2. **Garage & Mech Factory (`js/garage.js`)**
   - **8-Location Titan Anatomy (`HD`, `CT`, `LT`, `RT`, `LA`, `RA`, `LL`, `RL`):** Manage individual location Armor and Critical Slots.
   - **5 Weight Classes (50t Recon to 200t Assault):** Free-slot component mounting constrained by chassis Tonnage and per-part Critical Slots.
   - **Live Engineering Telemetry:** Tracks Total Mass, Alpha Strike Heat vs. Cooling Capacity, Movement Speed, and Blueprint Value.

3. **Tactical Battle Arena (`js/battle.js`)**
   - **Hexagonal Terrain Map:** Clear, Woods (cover), Water (reactor cooling), and Hills.
   - **Action-Time Combat Clock (Seconds):** Every movement, torso twist, coolant flush, or weapon shot advances the battle clock in seconds and ticks individual weapon recycle timers.
   - **8-Location Called Shots:** Target specific enemy locations (`HD`, `CT`, `LT`, `RT`, `LA`, `RA`, `LL`, `RL`) with accuracy modifiers based on Jock skills, range, and heat.

## How to Run Locally

Double-click `index.html` to launch the game in any web browser—no build step or server required.
