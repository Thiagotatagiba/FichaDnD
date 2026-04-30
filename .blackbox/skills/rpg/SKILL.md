---
name: rpg
description: Create, modify and improve RPG character sheets built with HTML, CSS and JavaScript. Use this skill when the user asks to add features (combat system, modals, status controls, emojis, rules), fix bugs, improve UI/UX, implement game logic, or refactor code in a web-based RPG sheet. This includes handling state changes, interactive elements, responsive layout, and gameplay mechanics.
---

# RPG Ficha Web

## Instructions

Follow these steps to assist with RPG character sheet development:

1. Understand the request context:
   - Identify if the user wants UI, logic, or both
   - Detect elements like combat, attributes, weapons, modals, or status

2. Preserve existing structure:
   - Do not break existing IDs, classes, or layout unless explicitly requested
   - Extend instead of replacing whenever possible

3. UI Implementation:
   - Use semantic HTML
   - Keep layout clean and modular
   - Prefer reusable components (cards, modals, buttons)
   - Ensure responsive design (desktop + mobile)

4. Game Logic:
   - Implement clear state handling (e.g., weapon states, HP, conditions)
   - Use simple and readable JavaScript
   - Avoid unnecessary complexity

5. Interactions:
   - Ensure buttons and controls give visual feedback
   - Maintain consistency (e.g., emoji states, toggles, selections)

6. Code Quality:
   - Keep code organized and readable
   - Use clear variable and function names
   - Comment only when necessary

7. When modifying existing features:
   - Respect current behavior
   - Only adjust what is required

8. When creating new features:
   - Provide complete working examples
   - Include HTML, CSS, and JS if needed

## Examples

### Example 1: Weapon State Button

User request:
"Add a button that cycles weapon states with emojis"

Expected behavior:
- Cycle through:
  🤚 (free hand)
  ✊ (weapon)
  👏 (two-handed)
  🛡️ (shield)

Implementation:
- Use a state index
- Update emoji on click
- Maintain consistency with other buttons

---

### Example 2: Modal Creation

User request:
"Create a modal to add a new adventure log entry"

Expected behavior:
- Button "+ Novo Registro"
- Opens modal
- Fields: Title + Description
- Save updates list dynamically

---

### Example 3: Layout Improvement

User request:
"Improve combat section layout"

Expected behavior:
- Group CA and HP visually
- Use grid or flexbox
- Keep alignment clean
- Maintain readability on mobile

---

### Example 4: Bug Fix

User request:
"Button not updating state correctly"

Expected behavior:
- Identify event issue
- Fix state logic
- Ensure UI updates correctly