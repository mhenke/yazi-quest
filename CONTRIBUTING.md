# Contributing to Yazi Quest

## Adding New Levels

1. Add level definition to `constants.tsx`
2. Implement check functions
3. Test all tasks complete properly
4. Update episode lore if needed

## Level Design Guidelines

- Each level should teach ONE core concept
- Tasks should build on previous knowledge
- Hints should guide, not solve
- Ensure hints reference specific keybindings

## Styling

- Use Tailwind CSS
- Follow the color scheme:
  - Episode 1: Blue
  - Episode 2: Purple
  - Episode 3: Yellow/Orange

## State Management

- Do not mutate the `fs` state directly. Always use helper functions in `utils/fsHelpers.ts` which return a new state copy (immutability).
