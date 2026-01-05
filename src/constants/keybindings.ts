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
    keys: ['.'],
    description: 'Toggle Hidden Files',
    narrativeDescription: ['Reveal Hidden Traces', 'Toggle Cloaking'],
  },
];

export const META_KEYBINDINGS = [
  { keys: ['Alt+M'], description: 'Quest Map', narrativeDescription: 'Access Neural Map' },
  { keys: ['Alt+H'], description: 'Show Hint', narrativeDescription: 'Query Oracle' },
  { keys: ['Alt+?'], description: 'Show Help', narrativeDescription: 'Access Codex' },
  {
    keys: ['Alt+Shift+M'],
    description: 'Toggle Sound',
    narrativeDescription: 'Toggle Audio Subroutines',
  },
];
