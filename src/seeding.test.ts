import { describe, it, expect } from 'vitest';
import { cloneFS } from '../utils/fsHelpers';
import { INITIAL_FS, LEVELS } from '../constants';
import { simulateCompletionOfLevel } from '../utils/seedLevels';
import { FileNode } from '../types';

// A helper to find a node by name for verification
const findNodeByName = (root: FileNode, name: string): FileNode | undefined => {
  if (root.name === name) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByName(child, name);
      if (found) return found;
    }
  }
  return undefined;
};

describe('Level Jump Seeding Logic', () => {
  it('should correctly produce the post-level state for Level 4', () => {
    // 1. Define initial state (pre-L4)
    const preLevel4State = cloneFS(INITIAL_FS);

    // 2. Define expected state (post-L4)
    // After level 4, a 'protocols' dir with two files should exist in 'datastore'.
    const expectedState = cloneFS(INITIAL_FS);
    const datastore = findNodeByName(expectedState, 'datastore');
    if (datastore && datastore.children) {
      const protocolsDir: FileNode = {
        id: 'test-protocols',
        name: 'protocols',
        type: 'dir',
        children: [
          {
            id: 'test-uplink1',
            name: 'uplink_v1.conf',
            type: 'file',
            content: 'network_mode=passive\nsecure=false',
          },
          {
            id: 'test-uplink2',
            name: 'uplink_v2.conf',
            type: 'file',
            content: 'network_mode=active\nsecure=true',
          },
        ],
      };
      datastore.children.push(protocolsDir);
    }

    // 3. Run the simulation
    const simulatedState = simulateCompletionOfLevel(preLevel4State, 4);

    // 4. Assert equivalence
    const simulatedDatastore = findNodeByName(simulatedState, 'datastore');
    const simulatedProtocols = simulatedDatastore?.children?.find((c) => c.name === 'protocols');

    expect(simulatedProtocols).toBeDefined();
    expect(simulatedProtocols?.type).toBe('dir');
    expect(simulatedProtocols?.children).toHaveLength(2);
    expect(simulatedProtocols?.children?.some((c) => c.name === 'uplink_v1.conf')).toBe(true);
    expect(simulatedProtocols?.children?.some((c) => c.name === 'uplink_v2.conf')).toBe(true);
  });

  it('should correctly simulate the "move" operation for Level 5', () => {
    // 1. Get the state after Level 4 is completed.
    const preLevel5State = simulateCompletionOfLevel(cloneFS(INITIAL_FS), 4);

    // Sanity check: ensure protocols dir exists before L5 simulation
    const preSimDatastore = findNodeByName(preLevel5State, 'datastore');
    expect(preSimDatastore?.children?.some((c) => c.name === 'protocols')).toBe(true);

    // 2. Run the simulation for Level 5 completion
    const simulatedState = simulateCompletionOfLevel(preLevel5State, 5);

    // 3. Assert the final state
    const postSimDatastore = findNodeByName(simulatedState, 'datastore');
    const postSimActive = findNodeByName(simulatedState, 'active');

    // Originals should be gone
    expect(postSimDatastore?.children?.some((c) => c.name === 'protocols')).toBe(false);

    // New files should exist in the new location
    expect(postSimActive).toBeDefined();
    expect(postSimActive?.children).toHaveLength(2);
    expect(postSimActive?.children?.some((c) => c.name === 'uplink_v1.conf')).toBe(true);
    expect(postSimActive?.children?.some((c) => c.name === 'uplink_v2.conf')).toBe(true);
  });

  it('should correctly simulate the creation of the neural_net for Level 8', () => {
    // 1. Get the state after Level 7 is completed.
    let preLevel8State = cloneFS(INITIAL_FS);
    for (let i = 1; i <= 7; i++) {
      preLevel8State = simulateCompletionOfLevel(preLevel8State, i);
    }

    // 2. Run the simulation for Level 8 completion
    const simulatedState = simulateCompletionOfLevel(preLevel8State, 8);

    // 3. Assert the final state
    const neuralNet = findNodeByName(simulatedState, 'neural_net');
    expect(neuralNet).toBeDefined();
    expect(neuralNet?.type).toBe('dir');

    const hasUplink = neuralNet?.children?.some((c) => c.name === 'uplink_v1.conf');
    expect(hasUplink).toBe(true);

    const weightsDir = neuralNet?.children?.find((c) => c.name === 'weights');
    expect(weightsDir).toBeDefined();
    expect(weightsDir?.type).toBe('dir');

    const hasModel = weightsDir?.children?.some((c) => c.name === 'model.rs');
    expect(hasModel).toBe(true);
  });

  it('should correctly simulate the extraction for Level 6', () => {
    // 1. Get the state after Level 5 is completed.
    let preLevel6State = cloneFS(INITIAL_FS);
    for (let i = 1; i <= 5; i++) {
      preLevel6State = simulateCompletionOfLevel(preLevel6State, i);
    }

    // 2. Run the simulation for Level 6 completion
    const simulatedState = simulateCompletionOfLevel(preLevel6State, 6);

    // 3. Assert the final state
    const media = findNodeByName(simulatedState, 'media');
    const incoming = findNodeByName(simulatedState, 'incoming');
    const archive = incoming?.children?.find((c) => c.name === 'backup_log_2024_CURRENT.zip');

    // sys_v1.log should exist in media
    expect(media?.children?.some((c) => c.name === 'sys_v1.log')).toBe(true);
    // sys_v1.log should exist inside the archive
    expect(archive?.children?.some((c) => c.name === 'sys_v1.log')).toBe(true);
  });

  it('should correctly simulate the asset security for Level 10', () => {
    // 1. Get the state after Level 9 is completed.
    let preLevel10State = cloneFS(INITIAL_FS);
    for (let i = 1; i <= 9; i++) {
      preLevel10State = simulateCompletionOfLevel(preLevel10State, i);
    }

    // 2. Run the simulation for Level 10 completion
    const simulatedState = simulateCompletionOfLevel(preLevel10State, 10);

    // 3. Assert the final state
    const datastore = findNodeByName(simulatedState, 'datastore');
    const credentials = datastore?.children?.find((c) => c.name === 'credentials');
    const vaultActive = findNodeByName(simulatedState, 'active');

    // Original access_key.pem should still exist
    expect(credentials?.children?.some((c) => c.name === 'access_key.pem')).toBe(true);

    // vault_key.pem should exist in vault/active
    expect(vaultActive?.children?.some((c) => c.name === 'vault_key.pem')).toBe(true);

    // Decoy files should be deleted from datastore
    expect(datastore?.children?.some((c) => c.name === 'decoy_1.pem')).toBe(false);
    expect(datastore?.children?.some((c) => c.name === 'decoy_2.pem')).toBe(false);
  });

  it('should correctly simulate the neural purge for Level 11', () => {
    // 1. Get the state after Level 10 is completed.
    let preLevel11State = cloneFS(INITIAL_FS);
    for (let i = 1; i <= 10; i++) {
      preLevel11State = simulateCompletionOfLevel(preLevel11State, i);
    }

    // 2. Run the simulation for Level 11 completion
    const simulatedState = simulateCompletionOfLevel(preLevel11State, 11);

    // 3. Assert the final state
    const workspace = findNodeByName(simulatedState, 'workspace');
    const tmp = findNodeByName(simulatedState, 'tmp');

    // neural_sig_alpha.log should be deleted from workspace
    expect(workspace?.children?.some((c) => c.name === 'neural_sig_alpha.log')).toBe(false);
    // neural_sig_alpha.log should exist in /tmp
    expect(tmp?.children?.some((c) => c.name === 'neural_sig_alpha.log')).toBe(true);

    // Other neural sig files should remain in workspace
    expect(workspace?.children?.some((c) => c.name === 'neural_sig_beta.dat')).toBe(true);
    expect(workspace?.children?.some((c) => c.name === 'neural_sig_gamma.tmp')).toBe(true);
  });

  it('should correctly produce the post-level state for Level 15', () => {
    // 1. Define initial state (pre-L15)
    // The state before L15 should have the sector_1 and grid_alpha directories present.
    const preLevel15State = cloneFS(INITIAL_FS);
    const guestDir = findNodeByName(preLevel15State, 'guest');
    if (guestDir && guestDir.children) {
      guestDir.children.push({ id: 'test-sector', name: 'sector_1', type: 'dir' });
      guestDir.children.push({ id: 'test-grid', name: 'grid_alpha', type: 'dir' });
    }

    // 2. Run the simulation for Level 15 completion
    const simulatedState = simulateCompletionOfLevel(preLevel15State, 15);

    // 3. Assert equivalence (post-L15)
    // After level 15, 'sector_1' and 'grid_alpha' should be deleted.
    const simulatedGuest = findNodeByName(simulatedState, 'guest');
    expect(simulatedGuest?.children?.some((c) => c.name === 'sector_1')).toBe(false);
    expect(simulatedGuest?.children?.some((c) => c.name === 'grid_alpha')).toBe(false);
  });
});
