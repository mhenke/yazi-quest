import { FileNode } from '../types';
import { getNodeByPath, addNode, createPath, deleteNode, cloneFS } from './fsHelpers';

const makeId = () => Math.random().toString(36).substr(2, 9);

const ensureAdded = (
  fs: FileNode,
  parentPath: string[],
  node: { name: string; type: 'file' | 'dir' | 'archive'; content?: string }
) => {
  const parent = getNodeByPath(fs, parentPath);
  if (!parent) return fs;
  const exists = parent.children?.some((c) => c.name === node.name && c.type === node.type);
  if (exists) return fs;
  const res = addNode(fs, parentPath, { id: makeId(), ...node } as any);
  if (res.ok) return res.value;
  return fs;
};

const ensurePath = (fs: FileNode, basePath: string[], pathStr: string) => {
  const res = createPath(fs, basePath, pathStr);
  if (res.fs) return res.fs;
  return fs;
};

export const simulateCompletionOfLevel = (origFs: FileNode, levelId: number) => {
  let fs = cloneFS(origFs);
  try {
    // Level 4: protocols + uplinks
    if (levelId === 4) {
      const datastorePath = ['root', 'home', 'guest', 'datastore'];
      const datastoreNode = getNodeByPath(fs, datastorePath);
      if (datastoreNode && !datastoreNode.children?.some((c) => c.name === 'protocols')) {
        const addProt = addNode(fs, datastorePath, {
          id: makeId(),
          name: 'protocols',
          type: 'dir',
          children: [],
        } as any);
        if (addProt.ok) fs = addProt.value;
      }
      const updatedDatastore = getNodeByPath(fs, datastorePath);
      const protocolsNode = updatedDatastore?.children?.find(
        (c) => c.name === 'protocols' && c.type === 'dir'
      );
      if (protocolsNode) {
        const protocolsPath = ['root', 'home', 'guest', 'datastore', protocolsNode.id];
        fs = ensureAdded(fs, protocolsPath, {
          name: 'uplink_v1.conf',
          type: 'file',
          content: 'network_mode=passive\\nsecure=false',
        });
        fs = ensureAdded(fs, protocolsPath, {
          name: 'uplink_v2.conf',
          type: 'file',
          content: 'network_mode=active\\nsecure=true',
        });
      }
    }

    // Level 5: move uplinks to ~/.config/vault/active and remove originals
    if (levelId === 5) {
      fs = ensurePath(fs, ['root', 'home', 'guest'], '.config/vault/active/');
      const configNode =
        getNodeByPath(fs, ['root', 'home', 'guest', 'home']) ||
        getNodeByPath(fs, ['root', 'home', 'guest']);
      // use find by name instead
      const cfg = getNodeByPath(fs, ['root', 'home', 'guest'])?.children?.find(
        (c) => c.name === '.config'
      );
      const config = cfg;
      const vaultNode = config?.children?.find((c) => c.name === 'vault');
      const activeNode = vaultNode?.children?.find((c) => c.name === 'active');
      if (activeNode && config && vaultNode) {
        const activePath = ['root', 'home', 'guest', config.id, vaultNode.id, activeNode.id];
        fs = ensureAdded(fs, activePath, {
          name: 'uplink_v1.conf',
          type: 'file',
          content: 'network_mode=passive\\nsecure=false',
        });
        fs = ensureAdded(fs, activePath, {
          name: 'uplink_v2.conf',
          type: 'file',
          content: 'network_mode=active\\nsecure=true',
        });

        // Remove originals from datastore/protocols
        const datastorePath = ['root', 'home', 'guest', 'datastore'];
        const datastoreNode = getNodeByPath(fs, datastorePath);
        const protocolsNode = datastoreNode?.children?.find(
          (c) => c.name === 'protocols' && c.type === 'dir'
        );
        if (protocolsNode && protocolsNode.children) {
          const protocolsPath = ['root', 'home', 'guest', 'datastore', protocolsNode.id];
          const toRemove = ['uplink_v1.conf', 'uplink_v2.conf'];
          for (const fname of toRemove) {
            const fnode = protocolsNode.children.find((c) => c.name === fname && c.type === 'file');
            if (fnode) {
              const delRes = deleteNode(fs, protocolsPath, fnode.id, 'delete', false, 5);
              if (delRes.ok) fs = delRes.value;
            }
          }
          const updatedProtocols = getNodeByPath(fs, protocolsPath);
          if (
            updatedProtocols &&
            (!updatedProtocols.children || updatedProtocols.children.length === 0)
          ) {
            const rem = deleteNode(fs, datastorePath, updatedProtocols.id, 'delete', false, 5);
            if (rem.ok) fs = rem.value;
          }
        }
      }
    }

    // Level 6: ensure archive contains sys_v1.log and put sys_v1.log in ~/media
    if (levelId === 6) {
      const incomingPath = ['root', 'home', 'guest', 'incoming'];
      const incomingNode = getNodeByPath(fs, incomingPath);
      const archive = incomingNode?.children?.find(
        (c) => c.name === 'backup_log_2024_CURRENT.zip' && c.type === 'archive'
      );
      if (archive) {
        const archivePath = ['root', 'home', 'guest', 'incoming', archive.id];
        fs = ensureAdded(fs, archivePath, {
          name: 'sys_v1.log',
          type: 'file',
          content: 'System log v1',
        });
      }
      const mediaPath = ['root', 'home', 'guest', 'media'];
      fs = ensureAdded(fs, mediaPath, {
        name: 'sys_v1.log',
        type: 'file',
        content: 'System log v1',
      });
    }

    // Level 7: ensure /etc/sys_patch.conf exists (post-level state)
    if (levelId === 7) {
      fs = ensureAdded(fs, ['root', 'etc'], {
        name: 'sys_patch.conf',
        type: 'file',
        content: 'patch=1\n',
      });
    }

    // Level 8: ensure neural_net exists, contains uplink and weights/model.rs
    if (levelId === 8) {
      fs = ensurePath(fs, ['root', 'home', 'guest'], 'workspace/neural_net/');
      const workspaceNode = getNodeByPath(fs, ['root', 'home', 'guest'])?.children?.find(
        (c) => c.name === 'workspace'
      );
      const workspace = workspaceNode
        ? getNodeByPath(fs, ['root', 'home', 'guest', workspaceNode.id])
        : null;
      const neuralNode = workspace?.children?.find(
        (c) => c.name === 'neural_net' && c.type === 'dir'
      );
      if (neuralNode && workspaceNode) {
        const basePath = ['root', 'home', 'guest', workspaceNode.id, neuralNode.id];
        fs = ensureAdded(fs, basePath, {
          name: 'uplink_v1.conf',
          type: 'file',
          content: 'network_mode=passive\\nsecure=false',
        });
        fs = ensurePath(fs, basePath, 'weights/');
        const weightDir = getNodeByPath(fs, basePath)?.children?.find(
          (c) => c.name === 'weights' && c.type === 'dir'
        );
        if (weightDir) {
          const weightPath = [
            'root',
            'home',
            'guest',
            workspaceNode.id,
            neuralNode.id,
            weightDir.id,
          ];
          fs = ensureAdded(fs, weightPath, {
            name: 'model.rs',
            type: 'file',
            content: '// model weights',
          });
        }
      }
    }

    // Level 10: ensure decoys exist, copy+rename access_key.pem to vault_key.pem in vault active, and delete decoys
    if (levelId === 10) {
      const datastorePath = ['root', 'home', 'guest', 'datastore'];
      fs = ensureAdded(fs, datastorePath, {
        name: 'decoy_1.pem',
        type: 'file',
        content: 'DECOY KEY - DO NOT USE',
      });
      fs = ensureAdded(fs, datastorePath, {
        name: 'decoy_2.pem',
        type: 'file',
        content: 'DECOY KEY - DO NOT USE',
      });

      // simulate yank(copy) + rename at destination
      fs = ensurePath(fs, ['root', 'home', 'guest'], '.config/vault/active/');
      const configNode = getNodeByPath(fs, ['root', 'home', 'guest'])?.children?.find(
        (c) => c.name === '.config'
      );
      const cfg = configNode ? getNodeByPath(fs, ['root', 'home', 'guest', configNode.id]) : null;
      const vaultNode = cfg?.children?.find((c) => c.name === 'vault');
      const activeNode = vaultNode?.children?.find((c) => c.name === 'active');
      if (activeNode && vaultNode && cfg) {
        const activePath = ['root', 'home', 'guest', cfg.id, vaultNode.id, activeNode.id];
        fs = ensureAdded(fs, activePath, {
          name: 'vault_key.pem',
          type: 'file',
          content: 'ACCESS KEY',
        });
      }

      // delete decoys
      const dsNode = getNodeByPath(fs, datastorePath);
      if (dsNode && dsNode.children) {
        const decoys = ['decoy_1.pem', 'decoy_2.pem'];
        for (const dname of decoys) {
          const dn = dsNode.children.find((c) => c.name === dname && c.type === 'file');
          if (dn) {
            const r = deleteNode(fs, datastorePath, dn.id, 'delete', false, 10);
            if (r.ok) fs = r.value;
          }
        }
      }
    }

    // Level 11: ensure neural_sig files exist and simulate moving largest to /tmp
    if (levelId === 11) {
      const workspacePath = ['root', 'home', 'guest', 'workspace'];
      fs = ensureAdded(fs, workspacePath, {
        name: 'neural_sig_alpha.log',
        type: 'file',
        content: '0x',
      });
      fs = ensureAdded(fs, workspacePath, {
        name: 'neural_sig_beta.dat',
        type: 'file',
        content: '0x',
      });
      fs = ensureAdded(fs, workspacePath, {
        name: 'neural_sig_gamma.tmp',
        type: 'file',
        content: '0x',
      });
      const wsNode = getNodeByPath(fs, workspacePath);
      const alpha = wsNode?.children?.find(
        (c) => c.name === 'neural_sig_alpha.log' && c.type === 'file'
      );
      if (alpha) {
        const del = deleteNode(fs, workspacePath, alpha.id, 'delete', false, 11);
        if (del.ok) fs = del.value;
        fs = ensureAdded(fs, ['root', 'tmp'], {
          name: 'neural_sig_alpha.log',
          type: 'file',
          content: '0x',
        });
      }
    }

    // Level 15: ensure sector dirs
    if (levelId === 15) {
      fs = ensureAdded(fs, ['root', 'home', 'guest'], { name: 'sector_1', type: 'dir' });
      fs = ensureAdded(fs, ['root', 'home', 'guest'], { name: 'grid_alpha', type: 'dir' });
    }
  } catch (err) {
    // swallow errors; caller will log if needed
  }
  return fs;
};
