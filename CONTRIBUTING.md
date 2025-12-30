# Contributing to Yazi Quest

## Adding New Levels

1. Add level definition to `src/constants.tsx`. Ensure all new components or utilities are placed in `src/components/` and `src/utils/` respectively.
2. Implement check functions
3. Test all tasks complete properly
4. Update episode lore if needed

## Level Design Guidelines

- Each level primarily introduces a new core concept or workflow; challenge levels may integrate multiple skills.
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

## Development Workflow

- `npm run dev`: Starts the local development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Lints the code using ESLint.
- `npm run format`: Formats the code using Prettier.
