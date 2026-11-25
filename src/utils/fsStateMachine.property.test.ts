import {
  assert,
  array,
  boolean,
  commands,
  constantFrom,
  modelRun,
  nat,
  oneof,
  property,
  stringMatching,
  tuple,
} from 'fast-check';
import { describe, it, expect } from 'vitest';
import type { FileNode, FsError, Result } from '../types';
import {
  addNode,
  addNodeWithConflictResolution,
  deleteNode,
  findPathById,
  getNodeByPath,
  resolveAndCreatePath,
} from './fsHelpers';

/**
 * Model-based suite over the fs mutation algebra. The model is a Map of
 * id -> { parentId, name, type }; fsHelpers is the system under test. Every
 * command re-checks the whole tree against the model, so shrinked failures
 * point at the smallest divergent sequence.
 */

const ROOT = 'root';
/** Fixed parent for the conflict-resolution adds. */
const CONFLICT_PARENT = 'targets';
/** Directory `resolveAndCreatePath` runs are anchored in. */
const WORK = 'tmp';

type Entry = { parentId: string | null; name: string; type: FileNode['type'] };
type FsModel = { nodes: Map<string, Entry>; counter: number };
type Real = { fs: FileNode };

const fixedTree = (): FileNode => ({
  id: ROOT,
  name: 'root',
  type: 'dir',
  parentId: null,
  children: [
    {
      id: 'home',
      name: 'home',
      type: 'dir',
      parentId: ROOT,
      children: [
        {
          id: 'guest',
          name: 'guest',
          type: 'dir',
          parentId: 'home',
          children: [{ id: 'readme', name: 'readme.md', type: 'file', parentId: 'guest' }],
        },
      ],
    },
    {
      id: 'projects',
      name: 'projects',
      type: 'dir',
      parentId: ROOT,
      children: [
        {
          id: 'app',
          name: 'app',
          type: 'dir',
          parentId: 'projects',
          children: [{ id: 'main', name: 'main.ts', type: 'file', parentId: 'app' }],
        },
        { id: 'ptxt', name: 'notes.txt', type: 'file', parentId: 'projects' },
      ],
    },
    { id: CONFLICT_PARENT, name: 'targets', type: 'dir', parentId: ROOT, children: [] },
    { id: WORK, name: 'tmp', type: 'dir', parentId: ROOT, children: [] },
  ],
});

const FIXED_IDS = [
  ROOT,
  'home',
  'guest',
  'readme',
  'projects',
  'app',
  'main',
  'ptxt',
  CONFLICT_PARENT,
  WORK,
];

const initialModel = (): FsModel => {
  const nodes = new Map<string, Entry>();
  const walk = (n: FileNode, parentId: string | null) => {
    nodes.set(n.id, { parentId, name: n.name, type: n.type });
    for (const c of n.children ?? []) walk(c, n.id);
  };
  walk(fixedTree(), null);
  return { nodes, counter: 0 };
};

/** Independent oracle for lookup: the id path assembled from parent links. */
const modelPath = (m: Readonly<FsModel>, id: string): string[] | undefined => {
  const path: string[] = [];
  let cur: string | null | undefined = id;
  while (cur) {
    const entry = m.nodes.get(cur);
    if (!entry) return undefined;
    path.unshift(cur);
    cur = entry.parentId;
  }
  return path[0] === ROOT ? path : undefined;
};

const childIds = (m: Readonly<FsModel>, parentId: string): string[] =>
  [...m.nodes.entries()].filter(([, e]) => e.parentId === parentId).map(([id]) => id);

const siblingNames = (m: Readonly<FsModel>, parentId: string): Set<string> =>
  new Set(childIds(m, parentId).map((id) => m.nodes.get(id)!.name));

const isDir = (m: Readonly<FsModel>, id: string): boolean => {
  const t = m.nodes.get(id)?.type;
  return t === 'dir' || t === 'archive';
};

/** Conflict-naming spec: `_N` goes before a real extension, never before a leading dot. */
const expectedName = (base: string, type: FileNode['type'], taken: Set<string>): string => {
  const dot = base.lastIndexOf('.');
  const hasExt = dot > 0 && type === 'file';
  let name = base;
  for (let counter = 1; taken.has(name); counter++) {
    name = hasExt ? `${base.slice(0, dot)}_${counter}${base.slice(dot)}` : `${base}_${counter}`;
  }
  return name;
};

const collectIds = (root: FileNode): string[] => {
  const out: string[] = [];
  const walk = (n: FileNode) => {
    out.push(n.id);
    for (const c of n.children ?? []) walk(c);
  };
  walk(root);
  return out;
};

function checkIds(m: FsModel, r: Real): void {
  const ids = collectIds(r.fs);
  expect(new Set(ids).size, 'duplicate ids in real tree').toBe(ids.length);
  expect(ids.slice().sort()).toEqual([...m.nodes.keys()].sort());
}

function checkPaths(m: FsModel, r: Real): void {
  for (const [id, entry] of m.nodes) {
    const path = findPathById(r.fs, id);
    expect(path, `findPathById(${id})`).toBeDefined();
    const node = getNodeByPath(r.fs, path);
    expect(node?.id, `getNodeByPath(${path?.join('/')})`).toBe(id);
    expect(node?.name).toBe(entry.name);
    expect(node?.type).toBe(entry.type);
    expect(node?.parentId ?? null).toBe(entry.parentId);
    expect(path).toEqual(id === ROOT ? [ROOT] : modelPath(m, id));
  }
}

function checkSiblingNames(r: Real): void {
  const stack: FileNode[] = [r.fs];
  while (stack.length) {
    const n = stack.pop()!;
    stack.push(...(n.children ?? []));
    const names = (n.children ?? []).map((c) => c.name);
    expect(new Set(names).size, `duplicate sibling names under ${n.id}`).toBe(names.length);
  }
}

/** Checked after every command; failures shrink to the divergent step. */
function checkInvariants(m: FsModel, r: Real): void {
  checkIds(m, r);
  checkPaths(m, r);
  checkSiblingNames(r);
}

class AddCommand {
  constructor(
    private dirId: string,
    private name: string,
    private type: 'file' | 'dir'
  ) {}

  check(m: Readonly<FsModel>): boolean {
    return isDir(m, this.dirId) && !siblingNames(m, this.dirId).has(this.name);
  }

  run(m: FsModel, r: Real): void {
    const parentPath = modelPath(m, this.dirId)!;
    const prev = r.fs;
    const snapshot = JSON.stringify(prev);
    const node: FileNode = {
      id: `node-${m.counter}`,
      name: this.name,
      type: this.type,
      parentId: this.dirId,
      ...(this.type === 'dir' ? { children: [] } : {}),
    };
    const res: Result<FileNode, FsError> = addNode(prev, parentPath, node);
    expect(res.ok, `addNode ${this.name} under ${this.dirId}`).toBe(true);
    if (!res.ok) return;
    expect(JSON.stringify(prev)).toBe(snapshot); // previous tree not mutated

    m.counter++;
    m.nodes.set(node.id, { parentId: this.dirId, name: this.name, type: this.type });
    r.fs = res.value;
    checkInvariants(m, r);
  }

  toString(): string {
    return `Add(${this.dirId}, ${this.name}, ${this.type})`;
  }
}

class DeleteCommand {
  constructor(private targetId: string) {}

  check(m: Readonly<FsModel>): boolean {
    return this.targetId !== ROOT && m.nodes.has(this.targetId);
  }

  run(m: FsModel, r: Real): void {
    const entry = m.nodes.get(this.targetId)!;
    const parentPath = modelPath(m, entry.parentId!)!;
    const prev = r.fs;
    const snapshot = JSON.stringify(prev);
    const res = deleteNode(prev, parentPath, this.targetId);
    expect(res.ok, `deleteNode ${this.targetId}`).toBe(true);
    if (!res.ok) return;
    expect(JSON.stringify(prev)).toBe(snapshot); // previous tree not mutated

    const drop = (id: string) => {
      for (const c of childIds(m, id)) drop(c);
      m.nodes.delete(id);
    };
    drop(this.targetId);
    r.fs = res.value;
    checkInvariants(m, r);
  }

  toString(): string {
    return `Delete(${this.targetId})`;
  }
}

class ConflictAddCommand {
  constructor(
    private base: string,
    private type: 'file' | 'dir'
  ) {}

  check(m: Readonly<FsModel>): boolean {
    return isDir(m, CONFLICT_PARENT);
  }

  run(m: FsModel, r: Real): void {
    const parentPath = modelPath(m, CONFLICT_PARENT)!;
    const name = expectedName(this.base, this.type, siblingNames(m, CONFLICT_PARENT));
    const prev = r.fs;
    const snapshot = JSON.stringify(prev);
    const res = addNodeWithConflictResolution(prev, parentPath, {
      id: 'supplied-id',
      name: this.base,
      type: this.type,
      parentId: CONFLICT_PARENT,
      ...(this.type === 'dir' ? { children: [] } : {}),
    });
    expect(res.ok, `conflict add ${this.base}`).toBe(true);
    if (!res.ok) return;
    expect(JSON.stringify(prev)).toBe(snapshot); // previous tree not mutated

    const parent = getNodeByPath(res.value, parentPath)!;
    const created = (parent.children ?? []).filter((c) => c.name === name);
    expect(created.length, `exactly one '${name}' under ${CONFLICT_PARENT}`).toBe(1);
    expect(created[0].id).not.toBe('supplied-id'); // the SUT owns the id

    m.nodes.set(created[0].id, { parentId: CONFLICT_PARENT, name, type: this.type });
    r.fs = res.value;
    checkInvariants(m, r);
  }

  toString(): string {
    return `ConflictAdd(${CONFLICT_PARENT}, ${this.base}, ${this.type})`;
  }
}

const dirIdArb = oneof(
  constantFrom(ROOT, 'home', 'guest', 'projects', 'app', CONFLICT_PARENT, WORK),
  nat(15).map((n) => `node-${n}`)
);
const nameArb = constantFrom('foo', 'bar', '.env', 'notes.txt', 'data', 'config.json');
const typeArb = constantFrom<'file' | 'dir'>('file', 'dir');
const addArb = tuple(dirIdArb, nameArb, typeArb).map(
  ([dirId, name, type]) => new AddCommand(dirId, name, type)
);
const deleteArb = oneof(
  constantFrom(...FIXED_IDS),
  nat(40).map((n) => `node-${n}`)
).map((targetId) => new DeleteCommand(targetId));
const conflictAddArb = tuple(nameArb, typeArb).map(
  ([base, type]) => new ConflictAddCommand(base, type)
);

const NUM_RUNS = 100;

describe('property: fs mutation algebra is model-consistent', () => {
  it('add / delete / conflict-add keep the real tree in lockstep with the model', () => {
    const arb = commands<FsModel, Real>([addArb, deleteArb, conflictAddArb], { maxCommands: 40 });

    assert(
      property(arb, (cmds) => {
        modelRun(() => ({ model: initialModel(), real: { fs: fixedTree() } }), cmds);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('.env conflicts suffix to .env_1 and foo dir vs foo file to foo_1', () => {
    let fs = fixedTree();
    const parentPath = [ROOT, CONFLICT_PARENT];
    const add = (name: string, type: FileNode['type']) => {
      const res = addNodeWithConflictResolution(fs, parentPath, { id: `x-${name}`, name, type });
      expect(res.ok).toBe(true);
      if (res.ok) fs = res.value;
      return getNodeByPath(fs, parentPath)!.children!;
    };

    add('foo', 'dir');
    expect(add('foo', 'file').map((c) => c.name)).toEqual(['foo', 'foo_1']);
    add('.env', 'file');
    expect(add('.env', 'file').map((c) => c.name)).toContain('.env_1');
    expect(add('.env', 'file').map((c) => c.name)).toContain('.env_2');
    add('notes.txt', 'file');
    expect(add('notes.txt', 'file').map((c) => c.name)).toContain('notes_1.txt');
    expect(add('notes.txt', 'dir').map((c) => c.name)).toContain('notes.txt_1');
  });
});

describe('property: resolveAndCreatePath', () => {
  const segArb = stringMatching(/^[a-z]{1,4}$/);
  /** Prefix guarantees no accidental collision with fixedTree's top-level/guest names. */
  const freshSegArb = stringMatching(/^z[a-z]{1,3}$/);
  const startPathArb = constantFrom<string[]>(
    [ROOT],
    [ROOT, WORK],
    [ROOT, 'projects', 'app'],
    [ROOT, CONFLICT_PARENT]
  );

  it('creates 1-3 lowercase segments, returns a resolvable target, never mutates the input', () => {
    assert(
      property(array(segArb, { minLength: 1, maxLength: 3 }), boolean(), (segs, trailingSlash) => {
        const root = fixedTree();
        const snapshot = JSON.stringify(root);
        const startPath = [ROOT, WORK];
        const input = segs.join('/') + (trailingSlash ? '/' : '');

        const res = resolveAndCreatePath(root, startPath, input);

        expect(res.error ?? null).toBeNull();
        expect(res.collision).toBe(false);
        expect(res.targetNode).toBeDefined();
        expect(JSON.stringify(root)).toBe(snapshot); // input tree untouched

        // descend by name from the fixed start, collecting the id path
        const path = [...startPath];
        const created: FileNode[] = [];
        let node = getNodeByPath(res.fs, path)!;
        for (const seg of segs) {
          node = (node.children ?? []).find((c) => c.name === seg)!;
          expect(node).toBeDefined();
          path.push(node.id);
          created.push(node);
        }

        expect(created.map((n) => n.name)).toEqual(segs);
        expect(created[created.length - 1]).toBe(res.targetNode);
        expect(res.targetNode!.type).toBe(trailingSlash ? 'dir' : 'file');
        if (trailingSlash) {
          expect(res.targetNode!.children).toEqual([]);
        }
        for (const n of created.slice(0, -1)) {
          expect(n.type).toBe('dir');
          expect(n.children).toBeDefined();
        }
        for (const n of created) expect(n.parentId).toBeDefined();

        // the created target resolves at the created path
        expect(findPathById(res.fs, res.targetNode!.id)).toEqual(path);
        expect(getNodeByPath(res.fs, path)?.id).toBe(res.targetNode!.id);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('anchors absolute (/a/b) at root and tilde (~/a/b) at /home/guest regardless of currentPath', () => {
    assert(
      property(
        constantFrom<'/' | '~/'>('/', '~/'),
        startPathArb,
        array(freshSegArb, { minLength: 1, maxLength: 3 }),
        boolean(),
        (prefix, startPath, segs, trailingSlash) => {
          const root = fixedTree();
          const snapshot = JSON.stringify(root);
          const input = `${prefix}${segs.join('/')}${trailingSlash ? '/' : ''}`;

          const res = resolveAndCreatePath(root, startPath, input);

          expect(res.error ?? null).toBeNull();
          expect(res.collision).toBe(false);
          expect(res.targetNode).toBeDefined();
          expect(JSON.stringify(root)).toBe(snapshot);

          const expectedAnchor = prefix === '/' ? [ROOT] : [ROOT, 'home', 'guest'];
          const path = [...expectedAnchor];
          let node = getNodeByPath(res.fs, path)!;
          for (const seg of segs) {
            node = (node.children ?? []).find((c) => c.name === seg)!;
            expect(node).toBeDefined();
            path.push(node.id);
          }

          expect(node).toBe(res.targetNode);
          expect(res.targetNode!.type).toBe(trailingSlash ? 'dir' : 'file');
          expect(findPathById(res.fs, res.targetNode!.id)).toEqual(path);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('reports collision on an existing target without mutating the tree or duplicating nodes', () => {
    assert(
      property(
        array(segArb, { minLength: 1, maxLength: 3 }),
        boolean(),
        boolean(),
        (segs, createAsDir, retryAsDir) => {
          const root = fixedTree();
          const startPath = [ROOT, WORK];
          const first = resolveAndCreatePath(
            root,
            startPath,
            segs.join('/') + (createAsDir ? '/' : '')
          );
          expect(first.targetNode).toBeDefined();

          const snapshot = JSON.stringify(first.fs);
          const second = resolveAndCreatePath(
            first.fs,
            startPath,
            segs.join('/') + (retryAsDir ? '/' : '')
          );

          expect(JSON.stringify(first.fs)).toBe(snapshot);
          expect(JSON.stringify(second.fs)).toBe(snapshot);

          if (!createAsDir && retryAsDir) {
            // Requesting a directory where a file already exists is an error, not a soft collision.
            expect(second.error).toBeTruthy();
            expect(second.targetNode).toBeUndefined();
          } else {
            expect(second.error ?? null).toBeNull();
            expect(second.collision).toBe(true);
            expect(second.collisionNode?.id).toBe(first.targetNode!.id);
            expect(second.targetNode?.id).toBe(first.targetNode!.id);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('errors when an intermediate segment collides with an existing file', () => {
    assert(
      property(
        array(segArb, { minLength: 1, maxLength: 2 }),
        array(segArb, { minLength: 1, maxLength: 2 }),
        boolean(),
        (fileSegs, tailSegs, trailingSlash) => {
          const root = fixedTree();
          const startPath = [ROOT, WORK];
          const first = resolveAndCreatePath(root, startPath, fileSegs.join('/'));
          expect(first.targetNode?.type).toBe('file');

          const snapshot = JSON.stringify(first.fs);
          const nested = [...fileSegs, ...tailSegs].join('/') + (trailingSlash ? '/' : '');
          const res = resolveAndCreatePath(first.fs, startPath, nested);

          expect(res.error).toBeTruthy();
          expect(res.targetNode).toBeUndefined();
          expect(JSON.stringify(first.fs)).toBe(snapshot);
          expect(JSON.stringify(res.fs)).toBe(snapshot);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('rejects empty, slash-only, invalid-start, and missing-home paths without mutating input', () => {
    assert(
      property(constantFrom('', '/', '///', '~/', '~///'), (input) => {
        const root = fixedTree();
        const snapshot = JSON.stringify(root);

        const res = resolveAndCreatePath(root, [ROOT, WORK], input);

        expect(res.error).toBeTruthy();
        expect(res.targetNode).toBeUndefined();
        expect(JSON.stringify(root)).toBe(snapshot);
        expect(JSON.stringify(res.fs)).toBe(snapshot);
      }),
      { numRuns: NUM_RUNS }
    );

    assert(
      property(array(segArb, { minLength: 1, maxLength: 2 }), (segs) => {
        const root = fixedTree();
        const snapshot = JSON.stringify(root);

        const badStart = resolveAndCreatePath(root, [ROOT, 'nonexistent'], segs.join('/'));
        expect(badStart.error).toBeTruthy();
        expect(badStart.targetNode).toBeUndefined();
        expect(JSON.stringify(root)).toBe(snapshot);
        expect(JSON.stringify(badStart.fs)).toBe(snapshot);

        // Tree without /home/guest must reject tilde paths cleanly.
        const noHome: FileNode = { id: ROOT, name: 'root', type: 'dir', children: [] };
        const noHomeSnap = JSON.stringify(noHome);
        const tildeRes = resolveAndCreatePath(noHome, [ROOT], `~/${segs.join('/')}`);
        expect(tildeRes.error).toBeTruthy();
        expect(tildeRes.targetNode).toBeUndefined();
        expect(JSON.stringify(noHome)).toBe(noHomeSnap);
        expect(JSON.stringify(tildeRes.fs)).toBe(noHomeSnap);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('never throws or mutates the input tree on whitespace-only path inputs', () => {
    assert(
      property(constantFrom(' ', '   ', '\t', '/   ', '~/   '), (input) => {
        const root = fixedTree();
        const snapshot = JSON.stringify(root);

        const res = resolveAndCreatePath(root, [ROOT, WORK], input);

        expect(JSON.stringify(root)).toBe(snapshot);
        expect(res.fs).toBeDefined();
      }),
      { numRuns: 50 }
    );
  });
});
