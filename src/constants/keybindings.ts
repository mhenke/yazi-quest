export interface JumpTargetDefinition {
  key: string;
  path: string[];
  label: string;
  displayName: string;
  helpPath: string;
  flag?: 'G' | 'GI' | 'GC' | 'GG' | 'GR' | 'GH';
  column: 'primary' | 'secondary';
}

export const JUMP_TARGETS: Readonly<Record<string, JumpTargetDefinition>> = {
  g: {
    key: 'g',
    path: [],
    label: 'top',
    displayName: 'Go to top',
    helpPath: 'top',
    flag: 'GG',
    column: 'primary',
  },
  h: {
    key: 'h',
    path: ['root', 'home', 'guest'],
    label: 'home',
    displayName: 'Go to home',
    helpPath: 'Home (~)',
    flag: 'GH',
    column: 'primary',
  },
  w: {
    key: 'w',
    path: ['root', 'home', 'guest', 'workspace'],
    label: 'workspace',
    displayName: 'Go to workspace',
    helpPath: 'Workspace',
    column: 'primary',
  },
  c: {
    key: 'c',
    path: ['root', 'home', 'guest', '.config'],
    label: 'config',
    displayName: 'Go to config',
    helpPath: 'Config (~/.config)',
    flag: 'GC',
    column: 'primary',
  },
  d: {
    key: 'd',
    path: ['root', 'home', 'guest', 'datastore'],
    label: 'datastore',
    displayName: 'Go to datastore',
    helpPath: 'Datastore',
    column: 'primary',
  },
  t: {
    key: 't',
    path: ['root', 'tmp'],
    label: 'tmp',
    displayName: 'Go to tmp',
    helpPath: 'Tmp (/tmp)',
    column: 'secondary',
  },
  i: {
    key: 'i',
    path: ['root', 'home', 'guest', 'incoming'],
    label: 'incoming',
    displayName: 'Go to incoming',
    helpPath: 'Incoming',
    flag: 'GI',
    column: 'secondary',
  },
  r: {
    key: 'r',
    path: ['root'],
    label: 'root',
    displayName: 'Go to root',
    helpPath: 'Root (/)',
    flag: 'GR',
    column: 'secondary',
  },
  l: {
    key: 'l',
    path: ['root', 'var', 'log'],
    label: 'log',
    displayName: 'Go to /var/log',
    helpPath: 'Log (/var/log)',
    column: 'secondary',
  },
  m: {
    key: 'm',
    path: ['root', 'var', 'mail'],
    label: 'mail',
    displayName: 'Go to /var/mail',
    helpPath: 'Mail (/var/mail)',
    column: 'secondary',
  },
};

export const KEYBINDINGS = [
  {
    keys: ['j', 'k', 'h', '↓', '↑', '←'],
    description: 'Navigate',
    narrativeDescription: [
      'Probe Sectors',
      'Trace Data Streams',
      'Map Neural Pathways',
      'Infiltrate Directories',
    ],
  },
  {
    keys: ['l', '→', 'Enter'],
    description: 'Enter Directory / View Archive',
    narrativeDescription: ['Infiltrate Directory', 'Access Sector', 'Dive Deeper'],
  },
  {
    keys: ['gg'],
    description: 'Jump to Top',
    narrativeDescription: ['Jump to Sector Entry', 'Rewind Data Stream'],
  },
  {
    keys: ['G'],
    description: 'Jump to Bottom',
    narrativeDescription: ['Jump to Sector Terminus', 'Advance Data Stream'],
  },
  {
    keys: ['J'],
    description: 'Scroll Preview Down',
    narrativeDescription: ['Scan Forward', 'Increase Scan Depth'],
  },
  {
    keys: ['H'],
    description: 'History Back (Shift+H)',
    narrativeDescription: ['Navigate Back in History', 'Undo Jump'],
  },
  {
    keys: ['K'],
    description: 'Scroll Preview Up',
    narrativeDescription: ['Scan Backward', 'Decrease Scan Depth'],
  },
  {
    keys: ['L'],
    description: 'History Forward (Shift+L)',
    narrativeDescription: ['Navigate Forward in History', 'Redo Jump'],
  },
  {
    keys: ['a'],
    description: 'Create File/Directory',
    narrativeDescription: ['Construct Modules', 'Spawn Pathways', 'Initialize Nodes'],
  },
  {
    keys: ['d'],
    description: 'Delete Selected',
    narrativeDescription: ['Purge Trackers', 'Wipe Evidence', 'Eliminate Threats'],
  },
  {
    keys: ['r'],
    description: 'Rename Selected',
    narrativeDescription: ['Forge Identity', 'Activate Camouflage', 'Generate Alias'],
  },
  {
    keys: ['Tab'],
    description: 'Show File Info Panel',
    narrativeDescription: ['Access Metadata', 'Query Properties', 'Inspect Signature'],
  },
  {
    keys: ['x'],
    description: 'Cut Selected',
    narrativeDescription: ['Extract Payloads', 'Sever Connections', 'Relocate Operations'],
  },
  {
    keys: ['y'],
    description: 'Copy/Yank Selected',
    narrativeDescription: ['Duplicate Assets', 'Archive Intelligence', 'Clone Data'],
  },
  {
    keys: ['p'],
    description: 'Paste',
    narrativeDescription: ['Deploy Assets', 'Install Modules', 'Inject Presence'],
  },
  {
    keys: ['P'],
    description: 'Paste (Overwrite)',
    narrativeDescription: ['Overwrite Assets', 'Force Deploy', 'Replace Target'],
  },
  {
    keys: ['Y', 'X'],
    description: 'Clear Clipboard',
    narrativeDescription: ['Wipe Clipboard', 'Purge Buffer', 'Clear Payload'],
  },
  {
    keys: ['Space'],
    description: 'Toggle Selection',
    narrativeDescription: ['Mark Targets', 'Lock Acquisition', 'Designate Objectives'],
  },
  {
    keys: ['Ctrl+A'],
    description: 'Select All',
    narrativeDescription: ['Acquire All Targets', 'Blanket Designation', 'Select Sector Group'],
  },
  {
    keys: ['Ctrl+R'],
    description: 'Invert Selection',
    narrativeDescription: ['Invert Acquisition', 'Flip Designation', 'Swap Targets'],
  },
  {
    keys: ['f'],
    description: 'Filter Files',
    narrativeDescription: ['Scan Signatures', 'Isolate Targets', 'Run Diagnostics'],
  },
  {
    keys: ['s'],
    description: 'Search (Recursive)',
    narrativeDescription: ['Deep Scan', 'Recursive Pattern Search', 'Trace Files via fd'],
  },
  {
    keys: ['z'],
    description: 'FZF Find (Recursive)',
    narrativeDescription: ['Quantum Jump', 'Global Search', 'Recursive Scan'],
  },
  {
    keys: ['Z'],
    description: 'Zoxide Jump (History)',
    narrativeDescription: ['Neural Link', 'Jump to History', 'Path Trace'],
  },
  {
    keys: ['Esc'],
    description: 'Clear Filter / Exit Mode',
    narrativeDescription: ['Disengage Protocols', 'Return to Idle', 'Clear Sub-routines'],
  },
  {
    keys: [','],
    description: 'Open Sort Menu',
    narrativeDescription: ['Optimize Sort Protocols', 'Access Sort Matrix'],
  },
  { keys: [',a'], description: 'Sort: Alphabetical', narrativeDescription: ['Sort: Alphabetical'] },
  {
    keys: [',A'],
    description: 'Sort: Alphabetical (Reverse)',
    narrativeDescription: ['Sort: Alphabetical (Reverse)'],
  },
  {
    keys: [',m'],
    description: 'Sort: Modified Time',
    narrativeDescription: ['Sort: Chronological'],
  },
  { keys: [',s'], description: 'Sort: Size', narrativeDescription: ['Sort: By Payload Size'] },
  { keys: [',e'], description: 'Sort: Extension', narrativeDescription: ['Sort: By Filetype'] },
  { keys: [',n'], description: 'Sort: Natural', narrativeDescription: ['Sort: Natural Order'] },
  {
    keys: [',l'],
    description: 'Sort: Cycle Linemode',
    narrativeDescription: ['Cycle Display Mode'],
  },
  {
    keys: [',-'],
    description: 'Sort: Clear Linemode',
    narrativeDescription: ['Clear Display Mode'],
  },
  {
    keys: ['gh'],
    description: 'Goto Home (~)',
    narrativeDescription: ['Navigate: Home Sector', 'Jump to Core'],
  },
  {
    keys: ['gc'],
    description: 'Goto Config (~/.config)',
    narrativeDescription: ['Navigate: Config Matrix', 'Jump to Settings'],
  },
  {
    keys: ['gw'],
    description: 'Goto Workspace',
    narrativeDescription: ['Navigate: Workspace Grid', 'Jump to Lab'],
  },
  {
    keys: ['gi'],
    description: 'Goto Incoming',
    narrativeDescription: ['Navigate: Incoming Stream', 'Jump to Staging'],
  },
  {
    keys: ['gd'],
    description: 'Goto Datastore',
    narrativeDescription: ['Navigate: Datastore Core', 'Jump to Archives'],
  },
  {
    keys: ['gt'],
    description: 'Goto Tmp (/tmp)',
    narrativeDescription: ['Navigate: Temp Buffer', 'Jump to Cache'],
  },
  {
    keys: ['gr'],
    description: 'Goto Root (/)',
    narrativeDescription: ['Navigate: Root Labyrinth', 'Jump to Kernel'],
  },
  {
    keys: ['gl'],
    description: 'Goto Log (/var/log)',
    narrativeDescription: ['Navigate: Audit Logs', 'Jump to /var/log'],
  },
  {
    keys: ['gm'],
    description: 'Goto Mail (/var/mail)',
    narrativeDescription: ['Navigate: Mail Spool', 'Jump to /var/mail'],
  },
  {
    keys: ['.'],
    description: 'Toggle Hidden Files',
    narrativeDescription: ['Reveal Hidden Traces', 'Toggle Cloaking'],
  },
];

// Simple keybindings for the HelpModal display, grouped by workflow.
// `description` is the literal Yazi action (primary wording for Help).
export const HELP_KEYBINDINGS = [
  {
    group: 'Navigation',
    keys: ['j', '↓'],
    description: 'Move Down',
    narrativeDescription: 'Navigation',
  },
  { group: 'Navigation', keys: ['k', '↑'], description: 'Move Up' },
  { group: 'Navigation', keys: ['h', '←'], description: 'Go to Parent Directory' },
  {
    group: 'Navigation',
    keys: ['o', 'l', '→', 'Enter'],
    description: 'Enter Directory / View Archive',
  },
  { group: 'Navigation', keys: ['gg'], description: 'Jump to Top' },
  { group: 'Navigation', keys: ['G'], description: 'Jump to Bottom' },
  { group: 'Navigation', keys: ['J'], description: 'Scroll Preview Down' },
  { group: 'Navigation', keys: ['K'], description: 'Scroll Preview Up' },
  { group: 'Navigation', keys: ['H'], description: 'History Back' },
  { group: 'Navigation', keys: ['L'], description: 'History Forward' },
  { group: 'Selection', keys: ['Space'], description: 'Toggle Selection' },
  { group: 'Selection', keys: ['Ctrl+A'], description: 'Select All' },
  { group: 'Selection', keys: ['Ctrl+R'], description: 'Invert Selection' },
  { group: 'File Operations', keys: ['a'], description: 'Create File/Directory' },
  { group: 'File Operations', keys: ['d'], description: 'Trash Selected' },
  { group: 'File Operations', keys: ['D'], description: 'Permanently Delete' },
  { group: 'File Operations', keys: ['r'], description: 'Rename Selected' },
  { group: 'Clipboard', keys: ['x'], description: 'Cut Selected' },
  {
    group: 'Clipboard',
    keys: ['y'],
    description: 'Yank selected (copy; originals remain)',
  },
  { group: 'Clipboard', keys: ['p'], description: 'Paste' },
  { group: 'Clipboard', keys: ['P'], description: 'Paste (Overwrite)' },
  { group: 'Clipboard', keys: ['Y', 'X'], description: 'Clear Clipboard' },
  { group: 'Find & Jump', keys: ['f'], description: 'Filter Files' },
  { group: 'Find & Jump', keys: ['s'], description: 'Search (Recursive)' },
  { group: 'Find & Jump', keys: ['z'], description: 'FZF Find (Recursive)' },
  { group: 'Find & Jump', keys: ['Z'], description: 'Zoxide Jump (History)' },
  { group: 'Find & Jump', keys: ['Esc'], description: 'Clear Filter / Exit Mode' },
  { group: 'Go To', keys: ['gh'], description: 'Goto Home (~)' },
  { group: 'Go To', keys: ['gc'], description: 'Goto Config (~/.config)' },
  { group: 'Go To', keys: ['gw'], description: 'Goto Workspace' },
  { group: 'Go To', keys: ['gi'], description: 'Goto Incoming' },
  { group: 'Go To', keys: ['gd'], description: 'Goto Datastore' },
  { group: 'Go To', keys: ['gt'], description: 'Goto Tmp (/tmp)' },
  { group: 'Go To', keys: ['gr'], description: 'Goto Root (/)' },
  { group: 'Go To', keys: ['gl'], description: 'Goto Log (/var/log)' },
  { group: 'Go To', keys: ['gm'], description: 'Goto Mail (/var/mail)' },
  { group: 'Sort', keys: [','], description: 'Open Sort Menu' },
  { group: 'Sort', keys: [',a'], description: 'Sort: Alphabetical' },
  { group: 'Sort', keys: [',A'], description: 'Sort: Alphabetical (Reverse)' },
  { group: 'Sort', keys: [',m'], description: 'Sort: Modified Time' },
  { group: 'Sort', keys: [',s'], description: 'Sort: Size' },
  { group: 'Sort', keys: [',e'], description: 'Sort: Extension' },
  { group: 'Sort', keys: [',n'], description: 'Sort: Natural' },
  { group: 'Sort', keys: [',l'], description: 'Sort: Cycle Linemode' },
  { group: 'Sort', keys: [',-'], description: 'Sort: Clear Linemode' },
  { group: 'View & Info', keys: ['Tab'], description: 'Show File Info Panel' },
  { group: 'View & Info', keys: ['.'], description: 'Toggle Hidden Files' },
];

export const HELP_META_KEYBINDINGS = [
  { keys: ['Alt+M'], description: 'Quest Map' },
  { keys: ['Alt+H'], description: 'Show Hint' },
  { keys: ['Alt+?'], description: 'Show Help' },
  { keys: ['Alt+O'], description: 'Toggle Mission Log' },
  { keys: ['Alt+Shift+M'], description: 'Toggle Sound' },
];
