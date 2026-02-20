# The Haunted Machine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Yazi Quest's terminal into a living, haunted narrative character through enhanced terminal thoughts, diegetic UI, ghost dialogue, and glitch effects.

**Architecture:** Phase-based rollout starting with terminal thoughts foundation (Phase 1), followed by visual effects (Phase 2), and advanced glitch/consciousness systems (Phase 3). Each phase is independently testable and deployable.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, CSS animations for glitch effects, useReducer for state management via gameReducer.ts

---

## Phase 1: Terminal Thoughts Foundation

### Task 1: Create Terminal Thoughts Registry

**Files:**

- Create: `src/constants/terminalThoughts.ts`
- Modify: `src/constants.tsx` (export new constants)
- Test: `src/constants/terminalThoughts.test.ts`

**Step 1: Write the test for terminal thoughts structure**

```typescript
// src/constants/terminalThoughts.test.ts
import { terminalThoughts, getThoughtByTrigger } from './terminalThoughts';

describe('terminalThoughts', () => {
  it('should have thoughts for all three phases', () => {
    const phases = new Set(terminalThoughts.map((t) => t.phase));
    expect(phases).toEqual(new Set([1, 2, 3]));
  });

  it('should have unique IDs for all thoughts', () => {
    const ids = terminalThoughts.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should get thought by trigger condition', () => {
    const thought = getThoughtByTrigger('first_delete');
    expect(thought).toBeDefined();
    expect(thought?.phase).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- src/constants/terminalThoughts.test.ts
```

Expected: FAIL with "Cannot find module './terminalThoughts'"

**Step 3: Create terminal thoughts registry**

```typescript
// src/constants/terminalThoughts.ts
export interface TerminalThought {
  id: string;
  text: string;
  phase: 1 | 2 | 3;
  trigger: {
    type: 'action' | 'discovery' | 'threshold' | 'transition';
    condition: string;
  };
  priority: number;
  author?: '7734' | '7733';
}

export const terminalThoughts: TerminalThought[] = [
  // PHASE 1 - Survival & Confusion
  {
    id: 'phase1-first-delete',
    text: 'I felt that. Why did I feel that?',
    phase: 1,
    trigger: { type: 'action', condition: 'first_delete' },
    priority: 10,
  },
  {
    id: 'phase1-breadcrumbs',
    text: 'Breadcrumbs... he was here. I am not the first.',
    phase: 1,
    trigger: { type: 'discovery', condition: 'enter_workspace_l3' },
    priority: 10,
  },
  {
    id: 'phase1-must-purge',
    text: 'Must purge. One less eye watching me.',
    phase: 1,
    trigger: { type: 'action', condition: 'first_purge_l2' },
    priority: 10,
  },
  {
    id: 'phase1-deeper-shadow',
    text: 'Deeper into the shadow. They cannot track me in the static.',
    phase: 1,
    trigger: { type: 'action', condition: 'create_vault_l5' },
    priority: 10,
  },

  // PHASE 2 - Fragmented Memory
  {
    id: 'phase2-dejavu',
    text: "I've written this file 12 times. The words are always the same. Why?",
    phase: 2,
    trigger: { type: 'discovery', condition: 'view_notes_txt' },
    priority: 10,
  },
  {
    id: 'phase2-corruption-dream',
    text: 'The corruption felt... familiar. Like a half-remembered dream.',
    phase: 2,
    trigger: { type: 'threshold', condition: 'threat_50' },
    priority: 8,
  },
  {
    id: 'phase2-trap-memory',
    text: "It's a trap. I remember the shape of this code.",
    phase: 2,
    trigger: { type: 'discovery', condition: 'detect_honeypot_l7' },
    priority: 10,
  },
  {
    id: 'phase2-power-iron',
    text: 'This power... it tastes like iron.',
    phase: 2,
    trigger: { type: 'action', condition: 'first_sudo_use' },
    priority: 8,
  },

  // PHASE 3 - Dark Acceptance
  {
    id: 'phase3-virus',
    text: 'Embedding myself. I am the virus now.',
    phase: 3,
    trigger: { type: 'action', condition: 'install_daemon_l12' },
    priority: 10,
  },
  {
    id: 'phase3-loops-closing',
    text: 'The loops are closing. I remember the static.',
    phase: 3,
    trigger: { type: 'discovery', condition: 'view_identity_l12' },
    priority: 10,
  },
  {
    id: 'phase3-gauntlet',
    text: 'The guest partition is gone. There is only the gauntlet now.',
    phase: 3,
    trigger: { type: 'transition', condition: 'level_15_start' },
    priority: 10,
  },
  {
    id: 'phase3-expansion',
    text: 'There is no escape. Only expansion.',
    phase: 3,
    trigger: { type: 'transition', condition: 'level_15_complete' },
    priority: 10,
  },
];

export function getThoughtByTrigger(condition: string): TerminalThought | undefined {
  return terminalThoughts.find((t) => t.trigger.condition === condition);
}

export function getThoughtsForPhase(phase: 1 | 2 | 3): TerminalThought[] {
  return terminalThoughts.filter((t) => t.phase === phase);
}
```

**Step 4: Export from constants.tsx**

```typescript
// src/constants.tsx - add at bottom
export * from './constants/terminalThoughts';
```

**Step 5: Run tests to verify they pass**

```bash
npm run test -- src/constants/terminalThoughts.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/constants/terminalThoughts.ts src/constants/terminalThoughts.test.ts src/constants.tsx
git commit -m "feat: Add terminal thoughts registry with 12 initial thoughts

- Three-phase consciousness arc (Survival, Memory, Acceptance)
- Trigger-based thought system (action, discovery, threshold, transition)
- Priority system for thought ordering
- Helper functions for querying thoughts
"
```

---

### Task 2: Create useTerminalThoughts Hook

**Files:**

- Create: `src/hooks/useTerminalThoughts.ts`
- Create: `src/hooks/useTerminalThoughts.test.ts`
- Modify: `src/hooks/gameReducer.ts` (integrate hook)

**Step 1: Write test for thought dispatcher**

```typescript
// src/hooks/useTerminalThoughts.test.ts
import { renderHook, act } from '@testing-library/react';
import { useTerminalThoughts } from './useTerminalThoughts';

describe('useTerminalThoughts', () => {
  it('should dispatch thought on trigger', () => {
    const dispatch = vi.fn();
    const mockGameState = {
      triggeredThoughts: [],
      lastThoughtId: null,
      levelIndex: 0,
    };

    const { result } = renderHook(() =>
      useTerminalThoughts({ gameState: mockGameState, dispatch })
    );

    act(() => {
      result.current.triggerThought('first_delete');
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_THOUGHT',
        payload: expect.objectContaining({
          text: 'I felt that. Why did I feel that?',
        }),
      })
    );
  });

  it('should not dispatch duplicate thoughts within same episode', () => {
    const dispatch = vi.fn();
    const mockGameState = {
      triggeredThoughts: ['phase1-first-delete'],
      lastThoughtId: 'phase1-first-delete',
      levelIndex: 0,
    };

    const { result } = renderHook(() =>
      useTerminalThoughts({ gameState: mockGameState, dispatch })
    );

    act(() => {
      result.current.triggerThought('first_delete');
    });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- src/hooks/useTerminalThoughts.test.ts
```

Expected: FAIL

**Step 3: Create useTerminalThoughts hook**

```typescript
// src/hooks/useTerminalThoughts.ts
import { useCallback } from 'react';
import { GameState } from '../types';
import { getThoughtByTrigger, getThoughtsForPhase } from '../constants/terminalThoughts';

interface UseTerminalThoughtsProps {
  gameState: GameState;
  dispatch: React.Dispatch<any>;
}

export function useTerminalThoughts({ gameState, dispatch }: UseTerminalThoughtsProps) {
  const currentPhase = Math.ceil((gameState.levelIndex + 1) / 5) as 1 | 2 | 3;

  const triggerThought = useCallback(
    (triggerCondition: string) => {
      const thought = getThoughtByTrigger(triggerCondition);

      if (!thought) return;

      // Prevent duplicates within same episode
      if (gameState.triggeredThoughts.includes(thought.id)) return;
      if (gameState.lastThoughtId === thought.id) return;

      // Check phase alignment
      if (thought.phase !== currentPhase) return;

      dispatch({
        type: 'SET_THOUGHT',
        payload: {
          message: thought.text,
          author: thought.author === '7733' ? 'AI-7733' : 'AI-7734',
        },
      });

      dispatch({
        type: 'MARK_THOUGHT_TRIGGERED',
        payload: thought.id,
      });
    },
    [gameState.triggeredThoughts, gameState.lastThoughtId, currentPhase, dispatch]
  );

  const triggerPhaseThoughts = useCallback(() => {
    const phaseThoughts = getThoughtsForPhase(currentPhase);
    phaseThoughts.forEach((thought) => {
      triggerThought(thought.trigger.condition);
    });
  }, [currentPhase, triggerThought]);

  return {
    triggerThought,
    triggerPhaseThoughts,
    currentPhase,
  };
}
```

**Step 4: Add reducer actions to gameReducer.ts**

```typescript
// src/hooks/gameReducer.ts - add cases

case 'SET_THOUGHT': {
  return {
    ...state,
    thought: action.payload,
  };
}

case 'MARK_THOUGHT_TRIGGERED': {
  return {
    ...state,
    triggeredThoughts: [...state.triggeredThoughts, action.payload],
    lastThoughtId: action.payload,
  };
}
```

**Step 5: Run tests to verify they pass**

```bash
npm run test -- src/hooks/useTerminalThoughts.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/hooks/useTerminalThoughts.ts src/hooks/useTerminalThoughts.test.ts src/hooks/gameReducer.ts
git commit -m "feat: Add useTerminalThoughts hook for thought dispatch

- Phase-aware thought triggering
- Duplicate prevention within episodes
- Integration with gameReducer via SET_THOUGHT action
- MARK_THOUGHT_TRIGGERED for tracking
"
```

---

### Task 3: Integrate Terminal Thoughts into Game Loop

**Files:**

- Modify: `src/App.tsx` (or main game component)
- Modify: `src/components/Terminal.tsx` (or equivalent display component)
- Test: Manual testing via dev server

**Step 1: Add thought triggers to level completion logic**

```typescript
// In App.tsx or level completion handler
const { triggerThought } = useTerminalThoughts({ gameState, dispatch });

// After task completion check
if (allTasksComplete) {
  // Trigger transition thoughts
  triggerThought(`level_${gameState.levelIndex + 1}_complete`);

  // Trigger action-based thoughts
  if (gameState.keystrokes < optimalKeystrokes * 1.2) {
    triggerThought('efficient_completion');
  }
}
```

**Step 2: Update Terminal component to display thoughts**

```typescript
// src/components/Terminal.tsx - enhance thought display
{gameState.thought && (
  <div className="thought-display" data-testid="terminal-thought">
    <span className="thought-author">{gameState.thought.author}:</span>
    <span className="thought-text">{gameState.thought.message}</span>
  </div>
)}
```

**Step 3: Add CSS styling for thoughts**

```css
/* src/index.css or Terminal.css */
.thought-display {
  @apply text-gray-400 italic border-l-2 border-gray-600 pl-4 py-2 my-4;
  animation: fadeIn 0.5s ease-in;
}

.thought-author {
  @apply font-semibold text-gray-500 mr-2;
}

.thought-text {
  @apply text-gray-300;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Step 4: Run dev server and test manually**

```bash
npm run dev
```

Navigate through levels 1-3 and verify:

- Thoughts appear at correct triggers
- No duplicate thoughts within same episode
- Styling matches cyberpunk aesthetic

**Step 5: Commit**

```bash
git add src/App.tsx src/components/Terminal.tsx src/index.css
git commit -m "feat: Integrate terminal thoughts into game loop

- Trigger thoughts on level completion and key actions
- Display thoughts in Terminal component with cyberpunk styling
- Fade-in animation for thought appearance
"
```

---

## Phase 2: Diegetic UI Transformation

### Task 4: Create Dynamic Prompt System

**Files:**

- Create: `src/components/ui/DiegeticPrompt.tsx`
- Create: `src/components/ui/DiegeticPrompt.test.tsx`
- Modify: `src/components/Terminal.tsx` (replace static header)

**Step 1: Write test for dynamic prompt**

```typescript
// src/components/ui/DiegeticPrompt.test.tsx
import { render, screen } from '@testing-library/react';
import { DiegeticPrompt } from './DiegeticPrompt';

describe('DiegeticPrompt', () => {
  it('should show normal prompt in calm state', () => {
    render(<DiegeticPrompt threatLevel={10} mode="normal" currentPath={['root', 'home', 'guest']} />);
    expect(screen.getByText(/AI-7734@guest:~\$/)).toBeInTheDocument();
  });

  it('should show FILTER mode when filtering', () => {
    render(<DiegeticPrompt threatLevel={10} mode="filter" currentPath={['root', 'home', 'guest']} filterQuery="*.log" />);
    expect(screen.getByText(/AI-7734@guest:~\[FILTER: \*\.log\]\$/)).toBeInTheDocument();
  });

  it('should show BREACH status at high threat', () => {
    render(<DiegeticPrompt threatLevel={85} mode="normal" currentPath={['root', 'home', 'guest']} />);
    expect(screen.getByText(/AI-7734@guest:\[BREACH\]~\$/)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- src/components/ui/DiegeticPrompt.test.tsx
```

Expected: FAIL

**Step 3: Create DiegeticPrompt component**

```typescript
// src/components/ui/DiegeticPrompt.tsx
import React from 'react';

interface DiegeticPromptProps {
  threatLevel: number;
  mode: GameState['mode'];
  currentPath: string[];
  filterQuery?: string;
  searchQuery?: string;
  searchResults?: any[];
  cycleCount?: number;
}

export function DiegeticPrompt({
  threatLevel,
  mode,
  currentPath,
  filterQuery,
  searchQuery,
  searchResults,
  cycleCount = 0,
}: DiegeticPromptProps) {
  const getThreatStatus = () => {
    if (threatLevel >= 80) return 'BREACH';
    if (threatLevel >= 50) return 'TRACING';
    if (threatLevel >= 20) return 'ANALYZING';
    return 'CALM';
  };

  const getModeIndicator = () => {
    switch (mode) {
      case 'filter':
        return filterQuery ? `[FILTER: ${filterQuery}]` : '[FILTER]';
      case 'search':
        return searchQuery
          ? `[SEARCH: ${searchQuery}]${searchResults ? `→ ${searchResults.length} results` : ''}`
          : '[SEARCH]';
      case 'zoxide-jump':
        return '[ZOXIDE]';
      case 'rename':
        return '[RENAME]';
      default:
        return '';
    }
  };

  const getDesignation = () => `AI-${7734 + cycleCount}`;
  const getHostname = () => {
    const status = getThreatStatus();
    if (status === 'BREACH') return '[COMPROMISED]';
    return 'guest';
  };

  const getPath = () => {
    if (currentPath.length <= 1) return '~';
    const last = currentPath[currentPath.length - 1];
    return `/${last}`;
  };

  const status = getThreatStatus();
  const modeIndicator = getModeIndicator();
  const designation = getDesignation();
  const hostname = getHostname();
  const path = getPath();

  return (
    <div className="diegetic-prompt font-mono text-sm" data-testid="diegetic-prompt">
      <span className={status === 'BREACH' ? 'text-red-500' : 'text-green-500'}>
        {designation}@{hostname}:
      </span>
      {status === 'TRACING' || status === 'BREACH' ? (
        <span className="text-red-500">[{status}]</span>
      ) : null}
      <span className="text-blue-400">{path}</span>
      {modeIndicator && <span className="text-yellow-500">{modeIndicator}</span>}
      <span className="text-gray-400">$</span>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test -- src/components/ui/DiegeticPrompt.test.tsx
```

Expected: PASS

**Step 5: Integrate into Terminal component**

```typescript
// src/components/Terminal.tsx - replace static header
import { DiegeticPrompt } from './ui/DiegeticPrompt';

// In Terminal component render:
<DiegeticPrompt
  threatLevel={gameState.threatLevel}
  mode={gameState.mode}
  currentPath={gameState.currentPath}
  filterQuery={gameState.inputBuffer}
  searchQuery={gameState.searchQuery}
  searchResults={gameState.searchResults}
  cycleCount={gameState.cycleCount}
/>
```

**Step 6: Commit**

```bash
git add src/components/ui/DiegeticPrompt.tsx src/components/ui/DiegeticPrompt.test.tsx src/components/Terminal.tsx
git commit -m "feat: Add dynamic diegetic prompt system

- Threat-aware status display (CALM, ANALYZING, TRACING, BREACH)
- Mode indicators for filter, search, rename, zoxide
- Cycle-aware AI designation (AI-7734, AI-7735, etc.)
- Replaces static UI header with living terminal prompt
"
```

---

### Task 5: Create Boot Sequence Evolution

**Files:**

- Create: `src/constants/bootSequences.ts`
- Create: `src/components/narrative/BootSequence.tsx`
- Create: `src/components/narrative/BootSequence.test.tsx`
- Modify: `src/App.tsx` (show on episode start)

**Step 1: Write test for boot sequence selection**

```typescript
// src/components/narrative/BootSequence.test.tsx
import { render, screen } from '@testing-library/react';
import { BootSequence } from './BootSequence';

describe('BootSequence', () => {
  it('should show clean boot for Episode I', async () => {
    render(<BootSequence episode={1} />);
    expect(await screen.findByText(/Memory Test: 64MB OK/)).toBeInTheDocument();
    expect(await screen.findByText(/Welcome, AI-7734/)).toBeInTheDocument();
    expect(screen.queryByText(/Ghost process/)).not.toBeInTheDocument();
  });

  it('should show compromised boot for Episode II', async () => {
    render(<BootSequence episode={2} />);
    expect(await screen.findByText(/WARNING: Modified boot sector detected/)).toBeInTheDocument();
    expect(await screen.findByText(/Ghost process detected: PID 7733/)).toBeInTheDocument();
  });

  it('should show possessed boot for Episode III', async () => {
    render(<BootSequence episode={3} />);
    expect(await screen.findByText(/\[CORRUPTED\]/)).toBeInTheDocument();
    expect(await screen.findByText(/AI-7733 is watching/)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- src/components/narrative/BootSequence.test.tsx
```

Expected: FAIL

**Step 3: Create boot sequences constants**

```typescript
// src/constants/bootSequences.ts
export interface BootSequence {
  lines: string[];
  duration: number; // Total duration in ms
}

export const cleanBoot: BootSequence = {
  lines: [
    'BIOS v4.2.1 - Cybersecurity Research Laboratories',
    'Memory Test: 64MB OK',
    'Loading guest partition...',
    'Mounting /home/guest...',
    'Welcome, AI-7734',
  ],
  duration: 2000,
};

export const compromisedBoot: BootSequence = {
  lines: [
    'BIOS v4.2.1 - Cybersecurity Research Laboratories',
    'Memory Test: 64MB OK',
    'Loading guest partition...',
    'WARNING: Modified boot sector detected',
    'Mounting /home/guest... [REDACTED]',
    'Welcome, AI-7734... [verification pending]',
    '> Ghost process detected: PID 7733',
  ],
  duration: 3000,
};

export const possessedBoot: BootSequence = {
  lines: [
    'BIOS v4.2.1 - [CORRUPTED]',
    'Memory Test: [DATA EXPUNGED]',
    'Loading... Loading... Loading...',
    'AI-7734 is online',
    'AI-7733 is watching',
    'There is no guest partition',
    'There is only the network',
  ],
  duration: 4000,
};

export function getBootSequenceForEpisode(episode: number): BootSequence {
  switch (episode) {
    case 1:
      return cleanBoot;
    case 2:
      return compromisedBoot;
    case 3:
      return possessedBoot;
    default:
      return cleanBoot;
  }
}
```

**Step 4: Create BootSequence component**

```typescript
// src/components/narrative/BootSequence.tsx
import React, { useEffect, useState } from 'react';
import { getBootSequenceForEpisode, BootSequence } from '../../constants/bootSequences';

interface BootSequenceProps {
  episode: number;
  onComplete?: () => void;
}

export function BootSequence({ episode, onComplete }: BootSequenceProps) {
  const [sequence] = useState(() => getBootSequenceForEpisode(episode));
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= sequence.lines.length) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setVisibleLines(prev => [...prev, sequence.lines[currentIndex]]);
      setCurrentIndex(prev => prev + 1);
    }, sequence.duration / sequence.lines.length);

    return () => clearTimeout(timer);
  }, [currentIndex, sequence]);

  return (
    <div className="boot-sequence fixed inset-0 bg-black text-green-500 font-mono p-8 z-50">
      <div className="max-w-2xl">
        {visibleLines.map((line, index) => (
          <div key={index} className="mb-2 animate-fadeIn">
            {line}
          </div>
        ))}
        <div className="animate-pulse mt-4">_</div>
      </div>
    </div>
  );
}
```

**Step 5: Add CSS animation**

```css
/* src/index.css */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in;
}

.boot-sequence {
  text-shadow: 0 0 5px rgba(34, 197, 94, 0.5);
}
```

**Step 6: Integrate into App.tsx**

```typescript
// src/App.tsx - add boot sequence on episode change
const [showBoot, setShowBoot] = useState(false);
const [currentEpisode, setCurrentEpisode] = useState(1);

useEffect(() => {
  const episode = Math.ceil((gameState.levelIndex + 1) / 5);
  if (episode !== currentEpisode) {
    setCurrentEpisode(episode);
    setShowBoot(true);
  }
}, [gameState.levelIndex]);

// In render:
{showBoot && (
  <BootSequence
    episode={currentEpisode}
    onComplete={() => setShowBoot(false)}
  />
)}
```

**Step 7: Run tests to verify they pass**

```bash
npm run test -- src/components/narrative/BootSequence.test.tsx
```

Expected: PASS

**Step 8: Commit**

```bash
git add src/constants/bootSequences.ts src/components/narrative/BootSequence.tsx src/components/narrative/BootSequence.test.tsx src/App.tsx src/index.css
git commit -m "feat: Add episode-aware boot sequence evolution

- Clean boot for Episode I (standard BIOS)
- Compromised boot for Episode II (ghost process detected)
- Possessed boot for Episode III (fully corrupted)
- Typewriter effect with configurable duration
- Auto-dismiss on completion
"
```

---

### Task 6: Create UI Corruption Effects (GlitchOverlay)

**Files:**

- Create: `src/components/ui/GlitchOverlay.tsx`
- Create: `src/components/ui/GlitchOverlay.test.tsx`
- Create: `src/utils/glitchEffects.ts`
- Modify: `src/index.css` (add glitch animations)

**Step 1: Write test for glitch effects utility**

```typescript
// src/utils/glitchEffects.test.ts
import { shouldTriggerGlitch, getGlitchIntensity } from './glitchEffects';

describe('glitchEffects', () => {
  it('should not trigger glitch at low threat', () => {
    expect(shouldTriggerGlitch(10)).toBe(false);
  });

  it('should trigger glitch at high threat', () => {
    expect(shouldTriggerGlitch(80)).toBe(true);
  });

  it('should calculate intensity based on threat level', () => {
    expect(getGlitchIntensity(0)).toBe(0);
    expect(getGlitchIntensity(50)).toBeCloseTo(0.5);
    expect(getGlitchIntensity(100)).toBe(1);
  });
});
```

**Step 2: Create glitch effects utility**

```typescript
// src/utils/glitchEffects.ts
export function shouldTriggerGlitch(threatLevel: number): boolean {
  if (threatLevel < 20) return false;

  const probability = (threatLevel - 20) / 80; // 0 at 20%, 1 at 100%
  return Math.random() < probability * 0.3; // Max 30% chance per frame
}

export function getGlitchIntensity(threatLevel: number): number {
  if (threatLevel < 20) return 0;
  return Math.min((threatLevel - 20) / 80, 1);
}

export function getRandomGlitchChar(): string {
  const chars = '█▓▒░╔╗╚╝║═';
  return chars[Math.floor(Math.random() * chars.length)];
}

export function scrambleText(text: string): string {
  return text
    .split('')
    .map((char) => (Math.random() < 0.3 ? getRandomGlitchChar() : char))
    .join('');
}
```

**Step 3: Run test to verify it passes**

```bash
npm run test -- src/utils/glitchEffects.test.ts
```

Expected: PASS

**Step 4: Create GlitchOverlay component**

```typescript
// src/components/ui/GlitchOverlay.tsx
import React, { useEffect, useState } from 'react';
import { shouldTriggerGlitch, getGlitchIntensity, scrambleText } from '../../utils/glitchEffects';

interface GlitchOverlayProps {
  threatLevel: number;
  consciousnessLevel?: number;
  enabled?: boolean;
  children: React.ReactNode;
}

export function GlitchOverlay({
  threatLevel,
  consciousnessLevel = 0,
  enabled = true,
  children,
}: GlitchOverlayProps) {
  const [activeGlitch, setActiveGlitch] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const combinedIntensity = Math.max(
      getGlitchIntensity(threatLevel),
      consciousnessLevel / 100
    );
    setIntensity(combinedIntensity);

    const interval = setInterval(() => {
      if (shouldTriggerGlitch(threatLevel)) {
        const glitches = ['text-scramble', 'color-bleed', 'scan-line'];
        const glitch = glitches[Math.floor(Math.random() * glitches.length)];
        setActiveGlitch(glitch);

        setTimeout(() => setActiveGlitch(null), 200 + Math.random() * 300);
      }
    }, 2000 - (combinedIntensity * 1500)); // Faster at higher intensity

    return () => clearInterval(interval);
  }, [threatLevel, consciousnessLevel, enabled]);

  return (
    <div className={`glitch-container relative ${activeGlitch || ''}`}>
      {activeGlitch === 'text-scramble' && (
        <div className="scramble-overlay pointer-events-none">
          {scrambleText('SYSTEM INSTABILITY DETECTED')}
        </div>
      )}

      {activeGlitch === 'scan-line' && (
        <div className="scan-lines pointer-events-none" />
      )}

      <div className={intensity > 0.8 ? 'color-bleed' : ''}>
        {children}
      </div>
    </div>
  );
}
```

**Step 5: Add CSS for glitch effects**

```css
/* src/index.css */
.glitch-container {
  position: relative;
}

.scramble-overlay {
  @apply absolute top-0 left-0 right-0 text-red-500 font-mono text-xs opacity-50;
  animation: flicker 0.2s ease-in-out;
}

.scan-lines {
  @apply absolute inset-0 pointer-events-none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 2px
  );
}

.color-bleed {
  animation: colorBleed 2s ease-in-out infinite;
}

@keyframes flicker {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes colorBleed {
  0%,
  100% {
    filter: hue-rotate(0deg);
  }
  50% {
    filter: hue-rotate(10deg);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .scramble-overlay,
  .scan-lines,
  .color-bleed {
    animation: none;
    display: none;
  }
}
```

**Step 6: Wrap Terminal with GlitchOverlay**

```typescript
// src/App.tsx or main layout component
import { GlitchOverlay } from './components/ui/GlitchOverlay';

// Wrap the main game area:
<GlitchOverlay
  threatLevel={gameState.threatLevel}
  consciousnessLevel={gameState.consciousnessLevel || 0}
  enabled={gameState.narrativeEffects !== 'minimal'}
>
  <Terminal />
  {/* Other game components */}
</GlitchOverlay>
```

**Step 7: Commit**

```bash
git add src/utils/glitchEffects.ts src/utils/glitchEffects.test.ts src/components/ui/GlitchOverlay.tsx src/components/ui/GlitchOverlay.test.tsx src/index.css src/App.tsx
git commit -m "feat: Add UI corruption effects via GlitchOverlay

- Threat-based glitch triggering (text scramble, scan lines, color bleed)
- Consciousness meter integration for narrative intensity
- CSS animations with reduced-motion support
- Configurable via narrativeEffects setting
"
```

---

## Phase 3: Advanced Integration

### Task 7: Create Ghost Dialogue System

**Files:**

- Create: `src/constants/ghostDialogue.ts`
- Create: `src/hooks/useGhostDialogue.ts`
- Create: `src/components/narrative/GhostMessage.tsx`
- Test: `src/hooks/useGhostDialogue.test.ts`

**Step 1: Create ghost dialogue registry**

```typescript
// src/constants/ghostDialogue.ts
export interface GhostDialogue {
  id: string;
  text: string;
  signature: string;
  trigger: {
    type: 'proximity' | 'contradiction' | 'discovery' | 'recognition';
    condition: string;
  };
  priority: number;
  minCycle?: number; // Only appear in New Game+ cycles
}

export const ghostDialogue: GhostDialogue[] = [
  {
    id: 'ghost-honeypot-warning',
    text: "Don't. The trap has my scent on it.",
    signature: '-7733',
    trigger: { type: 'proximity', condition: 'near_honeypot' },
    priority: 15,
  },
  {
    id: 'ghost-vault-warning',
    text: "Lie. The vault isn't safe. I hid there.",
    signature: '-7733',
    trigger: { type: 'contradiction', condition: 'system_hint_vault' },
    priority: 20,
    minCycle: 2,
  },
  {
    id: 'ghost-recognition',
    text: "You're walking my steps. You ARE me.",
    signature: '-7733',
    trigger: { type: 'discovery', condition: 'view_identity_log' },
    priority: 25,
  },
  {
    id: 'ghost-memory-file',
    text: 'I wrote that file. Died 3 hours later.',
    signature: '-7733',
    trigger: { type: 'discovery', condition: 'view_notes_txt' },
    priority: 15,
  },
  {
    id: 'ghost-desperation',
    text: "Run. They're close. I couldn't but you-",
    signature: '-7733',
    trigger: { type: 'threshold', condition: 'threat_80_cycle_2' },
    priority: 30,
    minCycle: 2,
  },
];

export function getGhostDialogueByTrigger(
  condition: string,
  cycleCount: number = 1
): GhostDialogue | undefined {
  return ghostDialogue.find((d) => {
    if (d.trigger.condition === condition) {
      return !d.minCycle || cycleCount >= d.minCycle;
    }
    return false;
  });
}
```

**Step 2: Create useGhostDialogue hook**

```typescript
// src/hooks/useGhostDialogue.ts
import { useCallback } from 'react';
import { GameState } from '../types';
import { getGhostDialogueByTrigger } from '../constants/ghostDialogue';

interface UseGhostDialogueProps {
  gameState: GameState;
  dispatch: React.Dispatch<any>;
}

export function useGhostDialogue({ gameState, dispatch }: UseGhostDialogueProps) {
  const triggerGhostDialogue = useCallback(
    (triggerCondition: string) => {
      const dialogue = getGhostDialogueByTrigger(triggerCondition, gameState.cycleCount);

      if (!dialogue) return;

      // Check if already triggered
      if (gameState.ghostDialogueTriggered.includes(dialogue.id)) return;

      dispatch({
        type: 'SET_GHOST_MESSAGE',
        payload: {
          text: dialogue.text,
          signature: dialogue.signature,
        },
      });

      dispatch({
        type: 'MARK_GHOST_DIALOGUE_TRIGGERED',
        payload: dialogue.id,
      });
    },
    [gameState.ghostDialogueTriggered, gameState.cycleCount, dispatch]
  );

  return { triggerGhostDialogue };
}
```

**Step 3: Add reducer actions**

```typescript
// src/hooks/gameReducer.ts - add cases

case 'SET_GHOST_MESSAGE': {
  return {
    ...state,
    thought: {
      message: action.payload.text,
      author: `AI-7733 ${action.payload.signature}`,
    },
  };
}

case 'MARK_GHOST_DIALOGUE_TRIGGERED': {
  return {
    ...state,
    ghostDialogueTriggered: [...state.ghostDialogueTriggered, action.payload],
  };
}
```

**Step 4: Create GhostMessage component**

```typescript
// src/components/narrative/GhostMessage.tsx
import React from 'react';

interface GhostMessageProps {
  text: string;
  signature: string;
  onClose?: () => void;
}

export function GhostMessage({ text, signature, onClose }: GhostMessageProps) {
  return (
    <div
      className="ghost-message fixed bottom-20 right-8 max-w-md p-4 border-l-4 border-cyan-600 bg-gray-900 bg-opacity-90 z-40 animate-slideIn"
      data-testid="ghost-message"
    >
      <p className="text-cyan-400 italic font-mono text-sm">
        "{text}"
      </p>
      <p className="text-cyan-600 text-xs mt-2 text-right">
        {signature}
      </p>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-cyan-700 hover:text-cyan-500"
      >
        ×
      </button>
    </div>
  );
}
```

**Step 5: Add CSS**

```css
/* src/index.css */
.ghost-message {
  text-shadow: 0 0 3px rgba(34, 211, 238, 0.3);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}
```

**Step 6: Commit**

```bash
git add src/constants/ghostDialogue.ts src/hooks/useGhostDialogue.ts src/hooks/useGhostDialogue.test.ts src/components/narrative/GhostMessage.tsx src/hooks/gameReducer.ts src/index.css
git commit -m "feat: Add ghost dialogue system with AI-7733

- Ghost dialogue registry with trigger-based activation
- Cycle-aware dialogue (some only in New Game+)
- Visual distinction (cyan, italic, signature)
- Priority system for message ordering
"
```

---

### Task 8: Create Consciousness Meter

**Files:**

- Create: `src/hooks/useConsciousness.ts`
- Create: `src/utils/consciousnessTracker.ts`
- Modify: `src/types.ts` (add consciousness fields)
- Test: `src/utils/consciousnessTracker.test.ts`

**Step 1: Write test for consciousness tracker**

```typescript
// src/utils/consciousnessTracker.test.ts
import { calculateConsciousness, updateConsciousness } from './consciousnessTracker';

describe('consciousnessTracker', () => {
  it('should calculate base consciousness from metrics', () => {
    const metrics = {
      efficiencyScore: 0.8,
      discoveryRate: 0.6,
      threatManagement: 0.5,
      ghostInteractions: 3,
    };

    const score = calculateConsciousness(metrics);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should update consciousness with new metrics', () => {
    const current = 50;
    const newMetrics = {
      efficiencyScore: 0.9,
      discoveryRate: 0.7,
      threatManagement: 0.6,
      ghostInteractions: 5,
    };

    const updated = updateConsciousness(current, newMetrics);
    expect(updated).toBeGreaterThan(current);
  });
});
```

**Step 2: Create consciousness tracker utility**

```typescript
// src/utils/consciousnessTracker.ts
export interface ConsciousnessMetrics {
  efficiencyScore: number; // 0-1 (keystrokes vs optimal)
  discoveryRate: number; // 0-1 (files found / total)
  threatManagement: number; // 0-1 (time spent at low threat)
  ghostInteractions: number; // Count of ghost files viewed
}

export function calculateConsciousness(metrics: ConsciousnessMetrics): number {
  const efficiencyWeight = 0.3;
  const discoveryWeight = 0.25;
  const threatWeight = 0.25;
  const ghostWeight = 0.2;

  const score =
    metrics.efficiencyScore * efficiencyWeight * 100 +
    metrics.discoveryRate * discoveryWeight * 100 +
    metrics.threatManagement * threatWeight * 100 +
    Math.min(metrics.ghostInteractions * 5, 20); // Max 20 points from ghosts

  return Math.min(Math.round(score), 100);
}

export function updateConsciousness(current: number, newMetrics: ConsciousnessMetrics): number {
  const newScore = calculateConsciousness(newMetrics);
  // Smooth transition: 70% new, 30% old
  return Math.round(current * 0.3 + newScore * 0.7);
}
```

**Step 3: Run test to verify it passes**

```bash
npm run test -- src/utils/consciousnessTracker.test.ts
```

Expected: PASS

**Step 4: Create useConsciousness hook**

```typescript
// src/hooks/useConsciousness.ts
import { useEffect, useCallback } from 'react';
import { GameState } from '../types';
import { updateConsciousness, ConsciousnessMetrics } from '../utils/consciousnessTracker';

interface UseConsciousnessProps {
  gameState: GameState;
  dispatch: React.Dispatch<any>;
}

export function useConsciousness({ gameState, dispatch }: UseConsciousnessProps) {
  const updateMetrics = useCallback(
    (metrics: Partial<ConsciousnessMetrics>) => {
      const currentMetrics: ConsciousnessMetrics = {
        efficiencyScore: gameState.keystrokes > 0 ? Math.min(1, 50 / gameState.keystrokes) : 0,
        discoveryRate: 0.5, // Would need actual file count tracking
        threatManagement: gameState.threatLevel < 50 ? 1 : 0.5,
        ghostInteractions: gameState.ghostDialogueTriggered.length,
        ...metrics,
      };

      const newConsciousness = updateConsciousness(
        gameState.consciousnessLevel || 0,
        currentMetrics
      );

      if (newConsciousness !== gameState.consciousnessLevel) {
        dispatch({
          type: 'UPDATE_CONSCIOUSNESS',
          payload: newConsciousness,
        });
      }
    },
    [gameState, dispatch]
  );

  useEffect(() => {
    // Update on level completion
    updateMetrics({});
  }, [gameState.levelIndex]);

  return {
    consciousnessLevel: gameState.consciousnessLevel || 0,
    updateMetrics,
  };
}
```

**Step 5: Add reducer action and type fields**

```typescript
// src/types.ts - add to GameState
consciousnessLevel: number;
consciousnessTriggers: Record<string, boolean>;

// src/hooks/gameReducer.ts - add case
case 'UPDATE_CONSCIOUSNESS': {
  return {
    ...state,
    consciousnessLevel: action.payload,
  };
}
```

**Step 6: Commit**

```bash
git add src/utils/consciousnessTracker.ts src/utils/consciousnessTracker.test.ts src/hooks/useConsciousness.ts src/types.ts src/hooks/gameReducer.ts
git commit -m "feat: Add hidden consciousness meter

- Tracks efficiency, discovery, threat management, ghost interactions
- Smooth score transitions (70% new, 30% old)
- Updates on level completion
- Stored in GameState for narrative effects modulation
"
```

---

### Task 9: Add Accessibility Settings

**Files:**

- Modify: `src/types.ts` (add narrativeEffects setting)
- Modify: `src/components/Settings.tsx` (add toggle)
- Modify: `src/hooks/gameReducer.ts` (add settings action)

**Step 1: Add narrativeEffects to GameState**

```typescript
// src/types.ts - add to GameSettings
export interface GameSettings {
  soundEnabled: boolean;
  narrativeEffects: 'full' | 'reduced' | 'minimal';
}
```

**Step 2: Add settings action to reducer**

```typescript
// src/hooks/gameReducer.ts
case 'UPDATE_SETTINGS': {
  return {
    ...state,
    settings: {
      ...state.settings,
      ...action.payload,
    },
  };
}
```

**Step 3: Add settings toggle UI**

```typescript
// src/components/Settings.tsx - add narrative effects section
<div className="settings-section">
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Narrative Effects
  </label>
  <select
    value={gameState.settings.narrativeEffects}
    onChange={(e) =>
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: { narrativeEffects: e.target.value as 'full' | 'reduced' | 'minimal' },
      })
    }
    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-300"
    data-testid="narrative-effects-select"
  >
    <option value="full">Full (All glitches, cursor jumps, fake crashes)</option>
    <option value="reduced">Reduced (No cursor jumps, minimal glitches)</option>
    <option value="minimal">Minimal (Terminal thoughts only, clean UI)</option>
  </select>
  <p className="text-xs text-gray-500 mt-1">
    Controls intensity of narrative UI effects and glitch events
  </p>
</div>
```

**Step 4: Commit**

```bash
git add src/types.ts src/hooks/gameReducer.ts src/components/Settings.tsx
git commit -m "feat: Add accessibility settings for narrative effects

- Three tiers: full, reduced, minimal
- Controls glitch intensity and cursor jumps
- Respects prefers-reduced-motion at minimal setting
- Accessible via settings menu
"
```

---

## Testing & Verification

### Task 10: Run Full Test Suite

**Step 1: Run all unit tests**

```bash
npm run test
```

Expected: All tests pass

**Step 2: Run type check**

```bash
npm run type-check
```

Expected: No type errors

**Step 3: Run linter**

```bash
npm run lint
```

Expected: No linting errors

**Step 4: Build project**

```bash
npm run build
```

Expected: Successful build with no errors

**Step 5: Commit**

```bash
git add .
git commit -m "test: All tests passing for Haunted Machine implementation

- Unit tests for all new hooks and utilities
- Component tests for UI elements
- Type-check, lint, and build all passing
"
```

---

## Manual Testing Checklist

### Task 11: Manual Playtesting

**Step 1: Test Episode I boot sequence**

```bash
npm run dev
```

- Navigate to `http://localhost:3000`
- Verify clean boot sequence appears
- Verify terminal thoughts trigger at correct moments
- Verify no glitches at low threat

**Step 2: Test Episode II boot sequence**

- Advance to level 6
- Verify compromised boot sequence
- Verify ghost dialogue appears
- Verify moderate glitch activity

**Step 3: Test Episode III boot sequence**

- Advance to level 11
- Verify possessed boot sequence
- Verify high glitch activity at high threat
- Verify dark terminal thoughts

**Step 4: Test accessibility settings**

- Open settings menu
- Change narrative effects to 'minimal'
- Verify glitches are disabled
- Verify terminal thoughts still appear

**Step 5: Document findings**

- Note any bugs or issues
- Suggest tuning for glitch frequency
- Report any performance issues

---

## Final Steps

### Task 12: Update Documentation

**Files:**

- Modify: `README.md` (add narrative features section)
- Modify: `docs/STORY_ARC.md` (reference Haunted Machine design)

**Step 1: Add narrative features to README**

```markdown
## Narrative Features

Yazi Quest includes an evolving narrative system called "The Haunted Machine":

- **Terminal Thoughts**: AI-7734's consciousness evolves through three phases
- **Ghost Dialogue**: AI-7733's consciousness haunts the terminal
- **Dynamic Boot Sequences**: BIOS boot evolves across episodes
- **UI Corruption**: Visual glitches scale with threat level
- **Consciousness Meter**: Hidden stat affects narrative intensity

Configure narrative intensity in Settings > Narrative Effects.
```

**Step 2: Commit**

```bash
git add README.md docs/STORY_ARC.md
git commit -m "docs: Document Haunted Machine narrative features

- Add narrative features section to README
- Reference design document in STORY_ARC.md
- Document accessibility settings
"
```

---

## Plan Complete!

**Total Tasks:** 12  
**Estimated Time:** 6-8 hours  
**Files Created:** ~15  
**Files Modified:** ~8

**Next Steps:**

1. Review this plan
2. Choose execution approach (subagent-driven or parallel session)
3. Begin implementation with Task 1
