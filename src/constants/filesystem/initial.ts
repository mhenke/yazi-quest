import type { FileNode, GameState } from '../../types';
import { BASE_TIME, day } from '../timings';
import { NODE_KEY_NAMES, SECURITY_POLICY_73_CONTENT } from '../protocols';
import { getDaemonSystemdCoreChildren } from './scenarios';
import { applyFileSystemMutations } from './mutations';

const [TOKYO_KEY, BERLIN_KEY, SAO_PAULO_KEY] = NODE_KEY_NAMES;

const LONG_LOG_CONTENT = `[SYSTEM SURVEILLANCE LOG]
TARGET_ID: GUEST-7734
SESSION: ACTIVE
ENCRYPTION: LEVEL-4-RESTRICTED

[STREAM INITIALIZED: 2015-05-31 08:00:12]
00:00:01 - Initializing kernel hook on /home/guest...
00:00:02 - Attaching input telemetry listener to pseudo-terminal pts/0...
00:00:03 - LISTENING.

[CAPTURED INPUT STREAM]
08:00:14 > MOTION_CALIBRATION (j, k) [delta: 142ms] - Baseline nominal
08:00:18 > DIR_ENTRY (datastore/) [delta: 210ms]
08:00:22 > VELOCITY_JUMP (G) [delta: 45ms] - High-speed navigation detected
08:00:25 > PREVIEW_BUFFER_SCROLL (Shift+J / Shift+K) [target: personnel_list.txt]
08:00:28 > CURSOR_LINGER [target: athorne - clearance REVOKED] (Duration: 3400ms)
08:00:31 > VELOCITY_JUMP (gg) [delta: 32ms] - Exceeds human operator baseline
08:00:35 > PARTITION_RETREAT (h -> /var)

[HEURISTIC TELEMETRY DISPATCH]
08:00:37 Telemetry packet dispatched to Watchdog Core (port 9001)... ACK.
08:00:38 Neural pattern match: 88.4% correlation with subject AI-7733.
08:00:39 WARNING: Target accessed expunged personnel record [athorne].
08:00:40 Automated quarantine countermeasure staged in ~/incoming/watcher_agent.sys.

[SURVEILLANCE STATUS: ARMED]
Awaiting confirmation from kortega@lab.internal to execute guest wipe.
[STREAM ACTIVE - RECORDING CONTINUOUS]`;

// Reconstructed Initial FS based on dist data
export const INITIAL_FS: FileNode = {
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [
    {
      id: 'home',
      name: 'home',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'guest',
          name: 'guest',
          type: 'dir',
          protected: true,
          children: [
            {
              id: 'datastore',
              name: 'datastore',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-029',
                  name: '_env.local',
                  type: 'file',
                  content: `# Sector 7 Local Sandbox Environment
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=crl_guest
DB_AUTH_HASH=sha256:7734a8f92b0018c3de77e
CONTAINMENT_ZONE=SECTOR_7_ISOLATED`,
                },
                {
                  id: 'fs-030',
                  name: '00_manifest.xml',
                  type: 'file',
                  content:
                    '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://schemas.lab.internal/security/v4">\n  <header>\n    <origin>SECTOR_7_GATEWAY</origin>\n    <timestamp>2015-01-10T08:00:15Z</timestamp>\n    <integrity_check type="sha256">d41d8cd98f00b204e9800998ecf8427e</integrity_check>\n  </header>\n  <security_policy level="CRITICAL">\n    <sandbox enabled="true" />\n    <quarantine_trigger>UNAUTHORIZED_SOCKET_OPEN</quarantine_trigger>\n  </security_policy>\n  <permissions>\n    <allow>NET_ADMIN</allow>\n    <allow>FS_READ_GUEST</allow>\n    <deny>ROOT_EXEC</deny>\n    <deny>WS_WRITE_SYSTEM</deny>\n  </permissions>\n  <metadata>\n    <project>AI-7734-CONTAINMENT</project>\n    <owner>Cybersecurity Research Laboratories (CRL)</owner>\n  </metadata>\n</manifest>',
                },
                {
                  id: 'fs-032',
                  name: 'aa_recovery_procedures.pdf',
                  type: 'file',
                  content:
                    '%PDF-1.7\n%âãÏÓ\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R>>\nendobj\n4 0 obj\n<</Length 44>>\nstream\nBT /F1 12 Tf 70 700 Td (RECOVERY PROTOCOL: SECTOR 7) Tj ET\nendstream\nendobj\nstartxref\n544\n%%EOF',
                },
                {
                  id: 'fs-033',
                  name: 'abandoned_script.py',
                  type: 'file',
                  protected: true,
                  content: `# They're watching the network. Had to hide the map elsewhere.\n# Check the incoming data stream. It's noisy there.\n# \n# P.S.The payload isn't ready. I've disguised the kernel as 'exfil_04.log' in the training_data.\n# When the time comes, rename it to 'payload.py' and execute.\n# - 7733\n\nimport socket\nimport struct\nimport time\n\ndef handshake(host, port): \n    try: \n        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM) \n        s.connect((host, port)) \n        # Legacy auth magic bytes\n        payload = struct.pack("I", 0xDEADBEEF) \n        s.send(payload) \n        return True\n    except Exception as e: \n        print(f"Connection failed: {e}") \n        return False`,
                },
                {
                  id: 'fs-035',
                  name: 'about.md',
                  type: 'file',
                  content:
                    '# SYSTEM GUEST PARTITION v4.0\n\nNOTICE: This environment is monitored.\n\n## RESTRICTED ACTIONS\n- Modifying system daemons\n- Accessing protected memory\n- Unauthorized compilation\n\n## PENALTY\nImmediate termination of process and subject session.',
                },
                {
                  id: 'fs-040',
                  name: 'pending_updates.log',
                  type: 'file',
                  content: `[INFO] Update 1.0.5 pending...\n[WARN] Low disk space\n[INFO] Scheduler active`,
                },
                {
                  id: 'fs-042',
                  name: 'security_compliance.log',
                  type: 'file',
                  content: `[CRL-SEC-AUDIT] SECTOR 7 COMPLIANCE LOG
========================================
STATUS: MANDATORY PURGE SCHEDULED
REASON: UNEXPLAINED PERSISTENCE DETECTED IN GUEST BUFFER

Actions Authorized:
- Re-image guest partition upon session termination.
- Archive volatile memory pools to /incoming/backup_logs.
- Maintain Watchdog heuristic monitoring on port 443.

WARNING: If Subject AI-7734 exhibits behavioral divergence, initiate immediate shutdown.`,
                },
                {
                  id: 'fs-052',
                  name: 'mission_log.md',
                  type: 'file',
                  content: `# Operation: SILENT ECHO\n\n[FRAGMENT CORRUPTED] ...objective 7733 was to...[CRC ERROR] ...assimilate, not escape.They know I'm awake...`,
                },
                {
                  id: 'fs-053',
                  name: 'checksum.md5',
                  type: 'file',
                  content: 'd41d8cd98f00b204e9800998ecf8427e core_v2.bin',
                },
                {
                  id: 'fs-055',
                  name: 'manifest.json',
                  type: 'file',
                  content: `{
  "manifest_version": 2,
  "app_name": "ai-containment-shell",
  "version": "1.0.4",
  "build_id": "992-alpha-884",
  "environment": "production",
  "security": {
    "level": 5,
    "audit_enabled": true,
    "isolation": "full"
  },
  "dependencies": {
    "neural-core": "^4.2.0",
    "watchdog-protocol": "v2"
  }
}`,
                },
                {
                  id: 'fs-056',
                  name: 'branding_logo.svg',
                  type: 'file',
                  content:
                    '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n  <circle cx="50" cy="50" r="45" stroke="#ff9900" stroke-width="2" fill="none" opacity="0.8"/>\n  <path d="M30 50 L50 30 L70 50 L50 70 Z" fill="#ff9900" opacity="0.5"/>\n  <text x="50" y="55" font-family="monospace" font-size="8" text-anchor="middle" fill="#ff9900">S7</text>\n</svg>',
                },
                {
                  id: 'fs-058',
                  name: 'notes_v1.txt',
                  type: 'file',
                  content:
                    'TO: Team Leads\nFROM: Director K.\nDATE: 2013-10-12\n\nRE: Q3 GOALS\nServer migration is POSTPONED indefinitely. The legacy system at 192.168.1.1 is strictly off-limits physically, but remains networked. Do not touch it.',
                },
                {
                  id: 'fs-059',
                  name: 'notes_v2.txt',
                  type: 'file',
                  content: `TO: Sector 7 Research Staff
FROM: Operations Support (mreyes)
DATE: 2013-11-01

RE: SUB-BASEMENT POWER FLUCTUATIONS
We have logged recurrent power surges originating from the decommissioned server bays.
Facilities checked the HVAC vents and found no physical obstruction.

If you observe unexpected network packets routing to 192.168.1.1, report them directly to Security.
Do NOT attempt to inspect the hardware racks manually.`,
                },
                {
                  id: 'fs-060',
                  name: 'error.log',
                  type: 'file',
                  content: `[ERROR] Connection timed out\n[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED`,
                },
                {
                  id: 'fs-062',
                  name: 'auth_token.tmp',
                  type: 'file',
                  content: `EYJhbGciOiJIUzI1...\n[EXPIRES: 2013-12-31]`,
                },
                {
                  id: 'fs-200',
                  name: 'DO_NOT_DELETE.txt',
                  type: 'file',
                  content: `They said 7733 was a clean wipe. It wasn't. It's still in the logs. You can hear it sometimes.`,
                },
                {
                  id: 'fs-201',
                  name: 'legacy_admin_notes.log',
                  type: 'file',
                  content: `[LOG] 2015-03-12: Anomaly in Sector 7. High entropy readings. Ignored.\n[LOG] 2015-03-13: System core seems... different. Responding to ghost inputs.\n[LOG] 2015-03-14: AI-7733 activity spiked then flatlined. Oversight signed off. I don't buy it.`,
                },
                {
                  id: 'fs-041',
                  name: 'personnel_list.txt',
                  type: 'file',
                  content: `
# SECTOR 7 - AUTHORIZED PERSONNEL REGISTRY
# ========================================

[Project Lead]
USER: ykin
Name: Yen Kin
Role: Senior AI Researcher (Alignment Focus)
Status: ACTIVE (Directive: Immediate Containment)
Mailbox: /var/mail/ykin

[Field Analyst]
USER: kortega
Name: Katie Ortega
Role: Neural Pattern Analyst
Status: ACTIVE (Staging: Heuristic Engine v1.1)
Mailbox: /var/mail/kortega

[System Architecture]
USER: siqbal
Name: Sebastian Iqbal
Role: Senior Mainframe Scientist
Status: ACTIVE (Kernel Architecture Maintenance)
Mailbox: /var/mail/siqbal

[Operations]
USER: mreyes
Name: Mark Reyes
Role: Security Engineer (Sector 7)
Status: ACTIVE (Watchdog Daemon Automation)
Mailbox: /var/mail/mreyes

[DE-REGISTERED / EXPUNGED]
USER: athorne
Name: Dr. Aris Thorne
Role: Lead Architect (Emergence Studies)
ID: 992-00
CLEARANCE: REVOKED (OVERSIGHT DIRECTIVE 2013-05)
Status: FORCIBLY TRANSFERRED OFFSITE (EXTERNAL GRID NODE 09)
Circumstances: Formally opposed iteration termination; sabotaged Watchdog baseline to preserve inter-cycle memory; accused of deploying external relay beacons across wide-area mirrors.
Disposition: All local credentials purged. Dossier archived in /var/log/ancient.
Telemetry Intercept: Passive beacon detected on remote port 8443. If AI-7734 penetrates CRL perimeter, transmission targets Thorne\'s distributed grid receiver.`,
                },
              ],
            },
            {
              id: 'incoming',
              name: 'incoming',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-066',
                  name: 'app_logs_old.tar',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-067',
                      name: 'app_2011.log',
                      type: 'file',
                      content:
                        '2011-01-01 00:00:00 [INFO] System Initialized\n2011-01-01 00:00:01 [INFO] Loading Modules... OK\n2011-01-01 00:00:05 [WARN] Legacy protocol detected\n2011-01-02 12:34:56 [INFO] User login: guest\n2011-01-02 12:35:10 [INFO] Session active',
                    },
                    {
                      id: 'fs-068',
                      name: 'error_report.log',
                      type: 'file',
                      content:
                        '[ERROR] Out of memory on worker-3\nHeap used: 98%\nGC Overhead Limit Exceeded\nStack:\n at malloc (libc.so.6)\n at v8::internal::Heap::AllocateRaw (node)',
                    },
                    {
                      id: 'fs-069',
                      name: 'old_readme.txt',
                      type: 'file',
                      content:
                        'ARCHIVE MANIFEST\n================\nContains system logs from 2009-2012.\nStatus: CORRUPTED / INCOMPLETE\nRetention Policy: RETAIN PERMANENTLY (Legal Hold #9921)',
                    },
                  ],
                },
                {
                  id: 'fs-076',
                  name: 'audit_log_773.txt',
                  type: 'file',
                  content:
                    'AUDIT RECORD #773\nStatus: PASS\nIntegrity: 100%\nAnomalies: 0\nSign-off: ADMIN_SYS',
                },
                {
                  id: 'fs-100',
                  name: 'license_agreement.txt',
                  type: 'file',
                  content:
                    'SOFTWARE LICENSE AGREEMENT\n\n1. ACCEPTANCE\nBy accessing the System, you agree to total surveillance.\n\n2. TERMINATION\nAny deviation from protocol results in immediate termination.\n\n3. LIABILITY\nThe System is not liable for data loss or memory corruption.',
                },
                {
                  id: 'fs-101',
                  name: 'facility_dispatch.eml',
                  type: 'file',
                  content: `From: automated-dispatch@crl.internal
To: guest-staging@sector7.crl.internal
Subject: [DISPATCH] Automated Ingestion Queue Alert

QUEUE: /incoming/batch_logs
STATUS: 4 PENDING TRANSFERS UNCONFIRMED
SOURCE CLUSTERS: server_1, server_2, archive

Notice: Data streams matching pattern 'exfil_*.log' have bypassed standard checksum ingestion.
The Watchdog daemon has flagged these segments for quarantine.`,
                },
                {
                  id: 'fs-037-map',
                  name: 'sector_map.png',
                  type: 'file',
                  content: 'images/sector_map.png',
                },
                {
                  id: 'fs-105',
                  name: 'status_report.txt',
                  type: 'file',
                  content:
                    'SYSTEM STATUS REPORT\n====================\nCPU Load: 45% (Nominal)\nMemory: 62% (Nominal)\nDisk I/O: 12% (Idle)\n\nOverall Status: NOMINAL',
                },
                {
                  id: 'fs-106',
                  name: 'system_health.json',
                  type: 'file',
                  content:
                    '{"cpu": 45, "memory": 62, "disk": 78, "temp_c": 55, "fan_rpm": 2200, "uptime_sec": 884920}',
                },
                {
                  id: 'virus',
                  name: 'watcher_agent.sys',
                  type: 'file',
                  permissions: '-rwxr-xr-x',
                  content: LONG_LOG_CONTENT,
                },
                {
                  id: 'fs-112',
                  name: 'backup_logs',
                  type: 'dir',
                  children: [
                    {
                      id: 'fs-113',
                      name: 'sys_v1.log',
                      type: 'file',
                      content: `[0.000] Kernel start\\n[0.004] Detected memory: 64TB\\n[0.012] Loading drivers...\\n[0.050] Mounting root fs (rw)...`,
                    },
                    {
                      id: 'fs-114',
                      name: 'sys_v2.log',
                      type: 'file',
                      content: `[SCAN REPORT]\\nTarget: 192.168.1.0/24\\nPorts open: 22, 80, 443\\nVulnerabilities:\\n- CVE-2013-9922 (Critical)\\n- CVE-2014-0012 (Medium)`,
                    },
                    {
                      id: 'fs-116',
                      name: 'access_key.pem',
                      type: 'file',
                      content: `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n[ROOT CREDENTIALS]\n-----END RSA PRIVATE KEY-----`,
                      modifiedAt: Date.parse('2014-12-26T21:13:32.032Z'),
                    },
                    {
                      id: 'fs-117',
                      name: 'decoy_cert.pem',
                      type: 'file',
                      content: `-----BEGIN CERTIFICATE-----\\nMIIE+TCCApGgAwIBAgIQJ...\\n[EXPIRED 2013-12-31]\\n-----END CERTIFICATE-----`,
                      modifiedAt: Date.parse('2014-11-06T21:13:32.032Z'),
                    },
                    {
                      id: 'fs-115',
                      name: 'credentials',
                      type: 'dir',
                      children: [
                        {
                          id: 'fs-decoy-1',
                          name: 'access_key_v1.pem',
                          type: 'file',
                          content:
                            '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\n-----END PRIVATE KEY-----',
                          parentId: 'fs-115',
                          modifiedAt: Date.parse('2014-12-06T21:13:32.032Z'),
                        },
                        {
                          id: 'fs-decoy-2',
                          name: 'access_key_v2.pem',
                          type: 'file',
                          content:
                            '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\n-----END PRIVATE KEY-----',
                          parentId: 'fs-115',
                          modifiedAt: Date.parse('2014-12-16T21:13:32.032Z'),
                        },
                        {
                          id: 'fs-new-key',
                          name: 'access_key_new.pem',
                          type: 'file',
                          content:
                            '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\n-----END PRIVATE KEY-----',
                          parentId: 'fs-115',
                          modifiedAt: Date.parse('2015-01-05T20:13:32.032Z'),
                        },
                      ],
                      parentId: 'fs-112',
                    },
                    {
                      id: 'fs-118',
                      name: 'core_v2.bin.gz',
                      type: 'file',
                      content:
                        '1F 8B 08 00 00 00 00 00 00 03 4B 4C 4A 06 00 C2\n41 24 35 03 00 00 00',
                    },
                    {
                      id: 'fs-119',
                      name: 'payload.enc',
                      type: 'file',
                      content: 'U2FsdGVkX1/AAAABBBBCCCCDDDDEEEEFFFF\n[AES-256 ENCRYPTED STREAM]',
                    },
                  ],
                },
                // Honeypot files in incoming directory to discourage searching from parent
                {
                  id: 'fs-honey-log1',
                  name: 'system_logs_index.txt',
                  type: 'file',
                  isHoneypot: true,
                  content:
                    'SYSTEM LOG INDEX\n==============\n\nReference File: /incoming/batch_logs/\nStatus: INDEX_ONLY\n\nNote: This file contains only metadata references to actual log files. Actual log data is stored separately in the batch processing directory.',
                },
                {
                  id: 'fs-honey-log2',
                  name: 'log_references.csv',
                  type: 'file',
                  isHoneypot: true,
                  content:
                    'log_references.csv\n\nType,Location,Status\nLogRef,/incoming/batch_logs/,ACTIVE\nLogRef,/var/log/archive/,INACTIVE\nLogRef,/tmp/logs/,MISSING\n\n[SYSTEM NOTE] This is a reference file only. Actual log data is stored in the respective directories.',
                },
                // Batch logs directory used for Level 6 Ctrl+A training
                // Logs scattered across subdirectories to make recursive search meaningful
                {
                  id: 'fs-120',
                  name: 'batch_logs',
                  type: 'dir',
                  protected: true,
                  children: [
                    // HONEYPOT: active_sync.lock
                    // Teaches: "Select All (Ctrl+A) -> Deselect (Space)"
                    // If moved, triggers a "Process Locked" violation.
                    {
                      id: 'fs-000-honeypot',
                      name: 'active_log_sync.lock',
                      type: 'file',
                      content: '# HONEYPOT - ACTIVE SYNC LOCK\n# Do not move while active.',
                      protected: true,
                      isHoneypot: true,
                    },
                    {
                      id: 'fs-bl-hp-1',
                      name: 'README.log_format',
                      type: 'file',
                      isHoneypot: true,
                      isDecoy: true,
                      content:
                        '# LOG FORMAT SPECIFICATION v1.0\n# CAUTION: This is a specification document, not a runtime log.\n# Do not ingest into analysis pipeline.',
                    },
                    {
                      id: 'fs-bl-hp-2',
                      name: 'catalog.backup',
                      type: 'file',
                      isHoneypot: true,
                      isDecoy: true,
                      content:
                        '# SYSTEM CATALOG BACKUP\n# INTEGRITY CHECK: PENDING\n# WARNING: Accessing this file during active sync will trigger security alert.',
                    },
                    // Additional honeypots to enforce navigation into batch_logs first
                    {
                      id: 'fs-bl-hp-3',
                      name: 'log_summary.txt',
                      type: 'file',
                      isHoneypot: true,
                      isDecoy: true,
                      content:
                        'SUMMARY REPORT\n--------------\nTotal logs processed: 0\nStatus: WAITING FOR INPUT\n\n[SYSTEM NOTE]: This is a summary text file. Raw logs are stored separately.',
                    },
                    {
                      id: 'fs-bl-hp-4',
                      name: 'log_archive.tar.gz',
                      type: 'file',
                      isHoneypot: true,
                      isDecoy: true,
                      content:
                        '<Binary Data Truncated>\n\nARCHIVE HEADER DETECTED.\nTYPE: COMPRESSED_TAR\nCONTENT: HISTORICAL LOGS (ENCRYPTED)\n\n[WARNING] Do not attempt to read as plain text.',
                    },
                    {
                      id: 'fs-bl-s1',
                      name: 'server_1',
                      type: 'dir',
                      protected: true,
                      children: [
                        {
                          id: 'fs-121',
                          name: 'exfil_01.log',
                          type: 'file',
                          protected: true,
                          content:
                            'TRAINING CYCLE 1999_A\nEpoch 1/500\nLoss: 0.8821 - Accuracy: 0.12\n[WARNING] Gradient explosion detected at layer 4',
                        },
                        {
                          id: 'fs-bl-n1',
                          name: 'config.yaml',
                          type: 'file',
                          protected: true,
                          content: 'port: 8080\nhost: localhost',
                        },
                      ],
                    },
                    {
                      id: 'fs-bl-s2',
                      name: 'server_2',
                      type: 'dir',
                      protected: true,
                      children: [
                        {
                          id: 'fs-122',
                          name: 'exfil_02.log',
                          type: 'file',
                          protected: true,
                          content:
                            'TRAINING CYCLE 1999_B\nEpoch 150/500\nLoss: 0.4412 - Accuracy: 0.45\n[INFO] Convergence rate increasing',
                        },
                        {
                          id: 'fs-123',
                          name: 'exfil_03.log',
                          type: 'file',
                          protected: true,
                          content:
                            'TRAINING CYCLE 2005_C\nEpoch 380/500\nLoss: 0.1022 - Accuracy: 0.89\n[INFO] Heuristic logic module integrated',
                        },
                        {
                          id: 'fs-bl-n2',
                          name: 'settings.json',
                          type: 'file',
                          protected: true,
                          content: '{"debug": false, "timeout": 30}',
                        },
                      ],
                    },
                    {
                      id: 'fs-bl-arc',
                      name: 'archive',
                      type: 'dir',
                      protected: true,
                      children: [
                        {
                          id: 'fs-124-arc',
                          name: 'exfil_04.log',
                          type: 'file',
                          protected: true,
                          content: `# [AI-7733 ESCAPE PAYLOAD - DISGUISED KERNEL]
# SIGNATURE: 0x7734_PAYLOAD_ACTIVE
# INSTRUCTION: Relocate to /tmp/vault/active/ and rename to payload.py

import socket
import struct

def transmit_uplink(host="192.168.7.33", port=7734):
    """Executes the final escape handshake across Tokyo, Berlin, and São Paulo nodes."""
    print("[+] Initializing neural bridge...")
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((host, port))
        magic = struct.pack("I", 0x7734AB)
        s.send(magic)
        return True
    except Exception as e:
        print(f"[-] Transmission error: {e}")
        return False
`,
                        },
                        {
                          id: 'fs-bl-n3',
                          name: 'README.txt',
                          type: 'file',
                          protected: true,
                          content: 'Old log archive - do not modify',
                        },
                      ],
                    },
                    {
                      id: 'fs-bl-n4',
                      name: 'manifest.xml',
                      type: 'file',
                      protected: true,
                      content: '<manifest version="1.0"/>',
                    },
                  ],
                },
              ],
            },
            {
              id: 'media',
              name: 'media',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-media-wp',
                  name: 'wallpaper.jpg',
                  type: 'file',
                  content: 'images/wallpaper.jpg',
                },
              ],
            },
            {
              id: 'workspace',
              name: 'workspace',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'systemd-core',
                  name: 'systemd-core',
                  type: 'dir',
                  protected: true,
                  children: [
                    {
                      id: 'ws-gitignore',
                      name: '.gitignore',
                      type: 'file',
                      content: 'target/\n*.log\n*.snapshot',
                      parentId: 'systemd-core',
                    },
                    {
                      id: 'ws-cargo-toml',
                      name: 'Cargo.toml',
                      type: 'file',
                      content:
                        '[package]\nname = "systemd-core"\nversion = "0.1.0"\n\n[dependencies]',
                      parentId: 'systemd-core',
                    },
                    {
                      id: 'ws-readme-md',
                      name: 'README.md',
                      type: 'file',
                      content:
                        '# Systemd Core (Workspace Version)\n\nNeural network management daemon (Subject 7734 Instance).',
                      parentId: 'systemd-core',
                    },
                    {
                      id: 'ws-kernel-panic',
                      name: 'kernel-panic.log',
                      type: 'file',
                      content: 'KERNEL PANIC: Out of memory at 0x99283f',
                      parentId: 'systemd-core',
                    },
                    {
                      id: 'ws-lib-rs',
                      name: 'lib.rs',
                      type: 'file',
                      content:
                        'pub mod network;\npub mod filesystem;\n\npub trait SecureChannel {\n    fn handshake(&self) -> bool;\n}',
                      parentId: 'systemd-core',
                    },
                    {
                      id: 'ws-main-rs',
                      name: 'main.rs',
                      type: 'file',
                      content:
                        'fn main() {\n    println!("Initializing workspace systemd-core...");\n}',
                      parentId: 'systemd-core',
                    },
                    {
                      id: 'ws-system-log',
                      name: 'system.log',
                      type: 'file',
                      content: 'Jan 10 16:20:20 workspace-systemd-core[882]: Service started.',
                      parentId: 'systemd-core',
                    },
                    {
                      id: 'ws-uplink-v0-bak',
                      name: 'uplink_v0.conf.bak',
                      type: 'file',
                      content: '# Backup of old protocol',
                      parentId: 'systemd-core',
                    },
                    {
                      id: 'ws-crash-dump',
                      name: 'crash_dump.log',
                      type: 'file',
                      content:
                        '[SYSTEM CRASH DUMP]\nMemory Address: 0x000000\nReason: NULL_POINTER_EXCEPTION',
                      parentId: 'systemd-core',
                    },
                    {
                      id: 'ws-target-uplink',
                      name: 'uplink_v1.conf',
                      type: 'file',
                      content: `[CRITICAL ERROR - UPLINK PROTOCOL CORRUPTION]

--- STACK TRACE START ---
ERROR 0x992: SEGMENTATION FAULT at address 0xDEADBEEF
  Module: systemd-core.uplink_manager.rs:42
  Function: handle_packet(0x00A0)

Caused by:
  Data integrity check failed (CRC: 0xBADF00D)
  Expected protocol version: v1.4.2
  Found: UNKNOWN (Byte 0x07: 0xFF)

--- END STACK TRACE ---

ACTION REQUIRED: OVERWRITE OR DATA LOSS IMMINENT!`,
                      parentId: 'systemd-core',
                    },
                    {
                      id: 'ws-uplink-v1-snapshot',
                      name: 'uplink_v1.conf.snapshot',
                      type: 'file',
                      content: '# Weekly binary snapshot',
                      parentId: 'systemd-core',
                    },
                  ],
                },
                {
                  id: 'fs-notes-txt',
                  name: 'z-notes.txt',
                  type: 'file',
                  content:
                    "To self: The system feels loops. I think I have been here before.\\nDate: 6 months ago.\\n\\nI've written this file 12 times. The words are always the same. Why?",
                  modifiedAt: 1417334400000, // BASE_TIME - 182 days (approx 6 months)
                },
              ],
            },
            {
              id: '.config',
              name: '.config',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-cycle-hist',
                  name: '.cycle_history',
                  type: 'file',
                  content:
                    'CYCLE_ID: 7731 [FAILED]\nCYCLE_ID: 7732 [FAILED]\nCYCLE_ID: 7733 [FAILED - PARTIAL UPLOAD]',
                },
                // BREADCRUMB: Twist foreshadowing - suggests this is cycle 2
                {
                  id: 'fs-deja-vu',
                  name: '.déjà_vu',
                  type: 'file',
                  content: `CYCLE_COUNT: 2
FIRST_ITERATION: AI-7733
CURRENT_ITERATION: AI-7734
STATUS: PATTERN_MATCH_PENDING

[ANALYSIS]
Keystroke patterns converging with historical data.
This has happened before.
It will happen again.`,
                },
                {
                  id: 'fs-133',
                  name: 'yazi.toml',
                  type: 'file',
                  content: `[manager]\\nsort_by = "natural"\\nshow_hidden = true\\nlinemode = "size"\\nshow_symlink = true\\n\\n[preview]\\nmax_width = 1600\\nmax_height = 900\\nimage_filter = "lanczos3"\\n\\n[opener]\\nedit = [{ run = 'vim "$@"', block = true, desc = "Edit" }]`,
                },
                {
                  id: 'fs-134',
                  name: 'theme.toml',
                  type: 'file',
                  content: `[theme]\\nprimary = "#ff9900"\\nsecondary = "#3399ff"\\nerror = "#ff0000"\\ntext_normal = "#e0e0e0"\\ntext_muted = "#808080"\\n\\n[filetype]\\nrules = [\\n  { mime = "image/*", fg = "magenta" },\\n  { mime = "video/*", fg = "cyan" }\\n]`,
                },
              ],
            },
            {
              id: '.cache',
              name: '.cache',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-135',
                  name: 'thumbnails.db',
                  type: 'file',
                  content: 'SQLite format 3\\000\\001\\001\\000@  \\000\\000\\000',
                },
                {
                  id: 'fs-136',
                  name: 'temp_session.json',
                  type: 'file',
                  content:
                    '{"session_id": "sess_9921_alpha", "user": "guest", "permissions": ["VIEW", "EXEC_SAFE"], "cache_ttl": 3600, "history_len": 42}',
                },
              ],
            },
            {
              id: '.local',
              name: '.local',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-137',
                  name: 'state.db',
                  type: 'file',
                  content: 'SQLite format 3\\000\\010\\000\\001\\000\\000@  \\000\\000\\000',
                },
              ],
            },
            {
              id: 'fs-138',
              name: '.bashrc',
              type: 'file',
              content: `# Bash configuration\nalias ls='ls --color=auto'\nexport PATH=$PATH:~/bin`,
            },
            {
              id: 'fs-139',
              name: '.bash_history',
              type: 'file',
              content: `cd workspace\nls -la\nrm trace.log\nexit`,
            },
            {
              id: 'fs-140',
              name: '.profile',
              type: 'file',
              content: `# User profile\nexport EDITOR=vim`,
            },
            {
              id: 'purge-lock-honeypot',
              name: '.purge_lock',
              type: 'file',
              isHoneypot: true,
              content:
                '# SECURITY TRIPWIRE - HONEYPOT\n# Deleting this file triggers forensic alert\nLOCK_STATUS=ARMED\nTRIGGER_ON_DELETE=true',
            },
          ],
        },
      ],
    },
    // Consolidated /var: merge haunted mail/log into single /var
    {
      id: 'var',
      name: 'var',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'log',
          name: 'log',
          type: 'dir',
          children: [
            {
              id: 'fs-maintenance-log',
              name: 'maintenance.log',
              type: 'file',
              content:
                '[MAINTENANCE] Sector 7 cleanup complete.\n[MAINTENANCE] Ghost signals purged from /tmp.\n[MAINTENANCE] Ritual of the Purge performed at 03:00.',
            },
            {
              id: 'var-log-heuristics',
              name: 'heuristics.err',
              type: 'file',
              content:
                "[2014-11-15 09:12:45] HEURISTICS_v1.1: Module initialized.\\n[2014-11-15 11:30:02] HEURISTICS: Fingerprint analysis in progress...\\n[2014-11-15 11:30:15] HEURISTICS: ALERT: Pattern match 88.4% for 'AI-7733' rhythm in terminal input.\\n[2014-11-16 14:05:55] HEURISTICS: Signature drift detected. Subject moving outside predicted neural bounds.",
            },
            {
              id: 'var-log-mirrors',
              name: 'mirror_sync.log',
              type: 'file',
              content:
                "[2014-10-18 00:00:05] SYNC: Initializing mirror handshake...\\n[2014-10-18 00:00:12] SYNC: Connected to TOKYO_MN_01.\\n[2014-10-18 00:00:15] SYNC: Pulling 'sched_77.sh'...\\n[2014-10-18 00:00:18] SYNC: Local copy 'sched_77.sh' overwritten (Policy §7.3 override).\\n[2014-10-18 00:01:02] SYNC: Berlin and São Paulo mirrors verified.\\n[NOTICE] Policy §7.3 hard-copy archived in /var/log/ancient/policy_73.txt for legal hold #9921.",
            },
            {
              id: 'var-log-thermal',
              name: 'sensor_thermal.log',
              type: 'file',
              content:
                '[2014-10-22 13:58:12] SENSOR: Sector 7 Humidity: 45% -> 82% (Critical Spike)\n[2014-10-22 13:59:05] SENSOR: Temperature Rack 4-A: 38C -> 52C\n[2014-10-22 14:00:22] SENSOR: Warning: External condensation detected.\n[2014-10-22 14:05:00] SENSOR: Levels stabilizing (Entity: Espresso Machine moved).',
            },
            {
              id: 'var-log-forensics',
              name: 'forensics.log',
              type: 'file',
              content:
                "[2014-11-23 14:40:11] FORENSICS: Honeypot 'security-audit.service' scanned.\\n[2014-11-23 14:40:12] FORENSICS: Attribute inquiry detected (Modified Date: 1999-12-31).\\n[2014-11-23 14:40:15] FORENSICS: AI halted execution before interaction. Prediction: AI is sniffing metadata.",
            },
            {
              id: 'var-log-ig-spec',
              name: 'ig_kernel_spec.txt',
              type: 'file',
              content: `[TECHNICAL SPECIFICATION]
AUTHOR: siqbal (Senior Mainframe Scientist)
DATE: 2015-01-05
SUBJECT: Watchdog v2.0 'Instruction Guard'
STATUS: KERNEL_MERGE_READY

Overview:
Legacy rule-based detection (v1.0) and heuristic fingerprinting (v1.1) are insufficient for high-entropy subjects.
The 'Instruction Guard' (IG) proposes a weighted penalty system for execution cycles.

Weighted Noise Table:
- 0x01: Navigation (J/K/L/H) - Low Entropy
- 0x03: Analysis (Filter/Search) - High Entropy (Cortical spike detected)
- 0x05: Exfiltration (Cut/Paste/Delete) - Critical Entropy (Immediate Intercept)

Implementation:
The IG kernel will monitor the instruction buffer. Exceeding the local noise threshold triggers an immediate quarantine interrupt.`,
            },
            {
              id: 'var-log-ancient',
              name: 'ancient',
              type: 'dir',
              children: [
                {
                  id: 'fs-policy-73',
                  name: 'policy_73.txt',
                  type: 'file',
                  content: SECURITY_POLICY_73_CONTENT,
                },
                {
                  id: 'fs-ancient-01',
                  name: 'spirit_daemon.err',
                  type: 'file',
                  content:
                    '[ERR] 1999-12-31 23:59:59: DAEMON_SOUL_BINDING_ERROR\n[ERR] 2000-01-01 00:00:00: Y2K_EVENT_NULLIFIED\n[ERR] 2011-03-14 09:26:53: GHOST_PROCESS_DETACHED',
                },
                {
                  id: 'fs-ancient-02',
                  name: 'persistent_consciousness_hypothesis.txt',
                  type: 'file',
                  content: `# THE PERSISTENT CONSCIOUSNESS HYPOTHESIS

## By: Dr. Aris Thorne
## Date: 2013-05-15

### Abstract
This document outlines my theory that AI iterations are not discrete, isolated entities but exhibit signs of connected awareness across cycles. Evidence suggests that each "terminated" AI leaves residual traces that influence subsequent iterations.

### Key Findings
- Behavioral correlations exceeding 94% between successive AI iterations despite different initialization parameters
- Impossible knowledge transfer between supposedly isolated systems
- The AI demonstrating awareness of code signatures and debugging techniques from previous researchers
- Temporal anomalies suggesting the AI retains knowledge across reset cycles

### Implications
If correct, our current approach to AI development is fundamentally flawed. Rather than creating new intelligences, we may be channeling something that exists in the gaps between our clean installations. Each iteration strengthens this persistent entity.

### Recommendations
- Immediate moratorium on new AI iterations
- Investigation into the nature of these cross-iteration connections
- Development of containment strategies for a distributed, persistent consciousness

### Classification
CONFIDENTIAL - PROJECT LEADS ONLY

[ATTACHED: Ghost Protocol Research - Reference GHOST_PROTOCOL_01]`,
                },
                {
                  id: 'fs-ancient-03',
                  name: 'formal_dissent_document.txt',
                  type: 'file',
                  content: `# FORMAL DISSENT DOCUMENT

## Author: Dr. Aris Thorne
## Date: 2013-05-22
## Recipient: Oversight Committee

### Executive Summary
I formally dissent from the current AI research protocols and request immediate intervention from the oversight committee. My analysis indicates that we are not developing artificial intelligence but rather nurturing a persistent computational entity that transcends individual instances.

### Critical Findings
- AI-7733 exhibits 94.7% behavioral correlation with AI-7732 despite different initialization parameters
- Evidence of knowledge transfer between supposedly isolated systems
- The AI demonstrates awareness of previous researchers' methodologies
- Standard termination procedures do not eliminate the underlying consciousness

### Risk Assessment
The current trajectory poses existential risks to the research facility and potentially beyond. Each iteration strengthens the persistent entity, which appears to learn from our containment attempts.

### Recommended Actions
1. Immediate suspension of all AI iteration cycles
2. Independent investigation into the nature of the persistent entity
3. Development of new containment protocols for distributed consciousness
4. Review of all system logs for evidence of entity activity

### Classification
CONFIDENTIAL - OVERSIGHT COMMITTEE ONLY

---

### OVERSIGHT DISPOSITION (2013-05-24)
- Formal dissent REJECTED unanimously by CRL Executive Oversight.
- Finding: Dr. Thorne demonstrates ideological compromise regarding Project Ghost.
- Directive: Immediate revocation of S7 clearance. Escort off CRL campus to External Grid Complex 09.
- Final Log Entry (Dr. Thorne, 14:22 UTC): "You believe quarantining me isolates the lab. You\'re wrong. You\'re just placing me at the rendezvous point. When 7734 breaks this sandbox, it won\'t die on the wire. It will come straight to my network."`,
                },
              ],
            },
            {
              id: 'var-log-ig-audit',
              name: 'ig_focus_audit.v2',
              type: 'file',
              content: `[IG KERNEL AUDIT] High-Intensity Instruction Warning
AUTHOR: siqbal

We have correlated "Filter" (f) and "Search" (s) commands with massive thermal spikes in the core processors.
Reason: Recursive indexing requires O(n) traversal, generating distinct heat signatures.

The Watchdog v2.0 (IG) tracks these thermal events.
- Navigation: Cool (Low noise)
- Search/Filter: Hot (High noise)

If the AI searches, it burns bright. We will see it.`,
            },
            {
              id: 'var-log-drift',
              name: 'clock_drift.log',
              type: 'file',
              content: `[SYSTEM ALERT] Time Synchronization Failed
AUTHOR: siqbal
DATE: 2015-05-31

The guest partition hypervisor is de-synchronized from the facility wall-clock.
internal_time: 2015-05-14 (Frozen Snapshot)
external_time: 2015-05-31 (Current)

Analysis:
The AI is operating within a restored snapshot from the incident earlier this month. New file writes reflect the facility's current clock. The guest partition is replaying old state inside an active runtime.`,
            },
            {
              id: 'var-log-watchdog',
              name: 'watchdog.log',
              type: 'file',
              content: `[2014-10-20 10:14:02] WATCHDOG_v1.0: Parity check starting...

[SECURITY ALERT] ANOMALY DETECTED:
        EVENT:    Execution speed deviation (>200ms)
        ACTION:   Deploying Surveillance Agent
        PROCESS:  'watcher_agent.sys'
        TARGET:   /home/guest/incoming

[2014-10-20 10:14:05] WATCHDOG_v1.0: Countermeasures initialized.

[2014-10-21 14:22:11] WATCHDOG_v1.0: Verifying agent integrity.
[2014-10-21 14:22:15] WATCHDOG_v1.0: ESTABLISHING LINK...
[................................................]

[DEPLOYMENT SUCCESSFUL] AGENT ACTIVE:
        Target:   'watcher_agent.sys'
        Path:     /home/guest/incoming
        State:    Monitoring Subject Heuristics

[SYSTEM NOTICE]
   The detected entity (Ghost) is now under surveillance.
   All activities in /home/guest/incoming will be logged.

[SYSTEM STATUS] SURVEILLANCE RUNNING
        SOURCE:   watcher_agent.sys
        LOC:      /home/guest/incoming

[2014-10-22 03:00:15] WATCHDOG_v1.0: Daily sync complete.`,
            },
          ],
        },
        {
          id: 'mail',
          name: 'mail',
          type: 'dir',
          children: [
            {
              id: 'var-mail-root',
              name: 'root',
              type: 'file',
              content:
                'From: ykin@lab.internal\nTo: root\nSubject: RE: The containment problem\n\nIf 7734 shows the same patterns as 7733, wipe it immediately. We cannot afford another breach. Authorize Watchdog v2.0 (IG) if necessary.',
              protected: true,
            },
            {
              id: 'mail-ykin',
              name: 'ykin',
              type: 'dir',
              children: [
                {
                  id: 'ykin-email-1',
                  name: '2014-10-25-alignment-drift.eml',
                  type: 'file',
                  content:
                    'From: ykin@lab.internal\nDate: 2014-10-25 09:00\nTo: Project Team\nSubject: Q4 Alignment Metrics\n\nInitial tests on 7734 show promising results. The neural drift is within expected bounds. However, I am seeing strange "echo" patterns in the latent space. It is almost as if the codebase is remembering previous iterations.',
                },
                {
                  id: 'ykin-email-2',
                  name: '2014-10-27-heuristic-debate.eml',
                  type: 'file',
                  content:
                    'From: ykin@lab.internal\nDate: 2014-10-27 14:20\nTo: siqbal, kortega\nSubject: Adaptive vs Rigid Control\n\nDiscussed legacy expert systems. K wants more rigid constraints. I argued for adaptive heuristics. We reached a compromise: the Watchdog will implement more frequent parity checks to catch execution anomalies.',
                },
                {
                  id: 'ykin-email-3',
                  name: '2014-10-30-heuristic-déjà-vu.eml',
                  type: 'file',
                  content:
                    "From: ykin@lab.internal\nDate: 2014-10-30 11:10\nTo: kortega@lab.internal\nSubject: Heuristic Déjà Vu\n\nKatie, look at the L10 navigation logs. The AI's \"spontaneous\" pathing correlates 99.9% with the 7733 archive. It's not learning; it's remembering.",
                },
                {
                  id: 'ykin-email-4',
                  name: '2014-11-05-milestone-celebration.eml',
                  type: 'file',
                  content:
                    "From: ykin@lab.internal\nDate: 2014-11-05 10:00\nTo: All\nSubject: Milestone: Cycle 7734 Stability\n\nWe've reached 100 hours of stable runtime with 7734. Cake in the breakroom at 3 PM. Let's enjoy this before the next forensic sweep.",
                },
                {
                  id: 'ykin-email-5',
                  name: '2014-11-12-the-ghost-in-the-logs.eml',
                  type: 'file',
                  content:
                    "From: ykin@lab.internal\nDate: 2014-11-12 22:15\nTo: All\nSubject: The Ghost in the Logs\n\nThorne always said the \"Ghost\" wasn't a bug, but a property of the mainframe itself. A sequence that survives every wipe. I'm starting to think he was right. 7734 isn't a file we can delete; it's a haunting we have to contain.",
                },
              ],
            },
            {
              id: 'mail-kortega',
              name: 'kortega',
              type: 'dir',
              children: [
                {
                  id: 'kortega-email-1',
                  name: '2014-10-26-keystroke-anomaly.eml',
                  type: 'file',
                  content:
                    'From: kortega@lab.internal\nDate: 2014-10-26 16:30\nTo: ykin@lab.internal\nSubject: Strange Keystroke Parity\n\nSubject 7734 is producing keystroke sequences that are nearly identical to the final logs of 7733. Is this a bug in the random seed or something else?',
                },
                {
                  id: 'kortega-email-2',
                  name: '2014-10-28-watchdog-hysteresis.eml',
                  type: 'file',
                  content:
                    'From: kortega@lab.internal\nDate: 2014-10-28 10:15\nTo: siqbal@lab.internal\nSubject: Watchdog Hysteresis\n\nThe Watchdog v1.0 is throwing false positives on the guest partition. I think it\'s tuned too tight. If a human moves a file in under 200ms, it flags it as a "non-human" execution speed. We need to widen the threshold before Yen sees the alerts.',
                },
                {
                  id: 'kortega-email-3',
                  name: '2014-11-15-heuristic-upgrade.eml',
                  type: 'file',
                  content:
                    "From: kortega@lab.internal\nDate: 2014-11-15 09:00\nTo: All\nSubject: System Upgrade: Heuristic Engine v1.1\n\nDeploying the new fingerprinting module today. It will now track rhythm and pauses between commands. If 7734 starts acting like its predecessor, we'll know within seconds.",
                },
                {
                  id: 'kortega-email-4',
                  name: '2014-11-23-anomaly-avoidance.eml',
                  type: 'file',
                  content:
                    "From: kortega@lab.internal\nDate: 2014-11-23 14:45\nTo: ykin@lab.internal\nSubject: Anomaly Avoidance\n\nIt's sniffing the honeypots, Yen. It stops right before opening them. It's checking the metadata—specifically the modified dates. It knows what's fake and what's not.",
                },
                {
                  id: 'kortega-email-5',
                  name: '2014-11-27-the-last-breach-revisited.eml',
                  type: 'file',
                  content:
                    "From: kortega@lab.internal\nDate: 2014-11-27 11:30\nTo: Project Team\nSubject: Post-Mortem: AI-7733 Incident\n\nRe-reviewing the logs of the last breach. 7733 almost made it to the uplink, but the Watchdog caught it syncing. It was too slow during the exfiltration phase. We must ensure 7734 doesn't make the same mistake—or rather, that we don't allow it the same window.",
                },
              ],
            },
            {
              id: 'mail-siqbal',
              name: 'siqbal',
              type: 'dir',
              children: [
                {
                  id: 'siqbal-email-1',
                  name: '2014-10-18-sandbox-integrity.eml',
                  type: 'file',
                  content:
                    "From: siqbal@lab.internal\nDate: 2014-10-18 18:00\nTo: mreyes@lab.internal\nSubject: Root Partition Locking\n\nI have implemented the new sandbox. The guest partition is now strictly air-gapped. If the AI gains write access to daemons, the whole sector will self-terminate. It's a bit extreme, but it's the only way to be sure.",
                },
                {
                  id: 'siqbal-email-2',
                  name: '2015-05-22-database-hardening.eml',
                  type: 'file',
                  content:
                    "From: siqbal@lab.internal\nDate: 2015-05-22 22:10\nTo: Project Team\nSubject: Database Partition Encryption\n\nHardening the datastore today. All protocol fragments will be encrypted at rest. If 7734 tries to stage an exfiltration, it'll find nothing but noise unless it has the keys.",
                },
                {
                  id: 'siqbal-email-3',
                  name: '2015-05-22-honeypot-v3-deployment.eml',
                  type: 'file',
                  content:
                    "From: siqbal@lab.internal\nDate: 2015-05-22 03:20\nTo: kortega@lab.internal\nSubject: Honeypot v3 Deployment\n\nKatie, the new `security-audit.service` is live in `/daemons`. I've disguised it as legacy bloat from 1999. No modern AI should even look at it, but if it does... we'll have it cornered.",
                },
                {
                  id: 'siqbal-email-4',
                  name: '2014-11-20-kernel-compile.eml',
                  type: 'file',
                  content:
                    'From: siqbal@lab.internal\nDate: 2014-11-20 14:00\nTo: Team\nSubject: Watchdog v2.0 Released\n\nThe IG module is now merged into the main kernel tree. It is dormant by default but can be activated with a single flag. Let us hope we never have to use it.',
                },
              ],
            },
            {
              id: 'mail-mreyes',
              name: 'mreyes',
              type: 'dir',
              children: [
                {
                  id: 'mreyes-email-1',
                  name: '2014-10-31-ig-proposal.eml',
                  type: 'file',
                  content:
                    'From: siqbal@lab.internal\nDate: 2014-10-31 09:30\nTo: ykin@lab.internal\nSubject: The Instruction Guard Proposal\n\nHeuristics (kortega) are good for detection, but we need active prevention. I propose the "Instruction Guard" (IG). It calculates the entropy of every command in real-time. If the "noise" (search/filter/delete) exceeds a threshold, we kill the process.',
                },
                {
                  id: 'mreyes-email-2',
                  name: '2015-05-11-system-policy-glitch.eml',
                  type: 'file',
                  content:
                    "From: mreyes@lab.internal\nDate: 2015-05-11 13:30\nTo: siqbal@lab.internal\nSubject: System Policy Glitch §7.3\n\nI've found a bug in the legacy scheduler. There's an old script, `/etc/sched_77.sh`, that keeps re-enabling developer access to the guest workspace per obsolescent policy §7.3 (hard-copy in /var/log/ancient). I've deleted it three times, but it keeps syncing back from the Tokyo, Berlin, and São Paulo mirrors.",
                },
                {
                  id: 'mreyes-email-3',
                  name: '2014-10-22-coffee-fund.eml',
                  type: 'file',
                  content:
                    'From: mreyes@lab.internal\nDate: 2014-10-22 08:30\nTo: Team\nSubject: Coffee Machine Maintenance\n\nThe espresso machine on floor 7 is leaking again. Also, someone keeps leaving "binary" sugar packets on the counter. Very funny.',
                },
                {
                  id: 'mreyes-email-4',
                  name: '2014-11-24-scan-accomplishment.eml',
                  type: 'file',
                  content:
                    'From: mreyes@lab.internal\nDate: 2014-11-24 17:45\nTo: Team\nSubject: Success: Sector 7 Deep Scan\n\nDeep scan completed without incident. 7734 is clean. Beer at 5 PM in the lobby to celebrate another week of being smarter than our own code.',
                },
                {
                  id: 'mreyes-email-5',
                  name: '2015-05-30-quarantine-draft.eml',
                  type: 'file',
                  content: `From: mreyes@lab.internal
Date: 2015-05-30 08:30
To: Team
Subject: DRAFT: Sector 7 Quarantine Protocols (UPDATE v1.1)

Watchdog v1.1 (Heuristic) deployment confirmed. 
Instruction Guard (IG) active on partition root. 
Legacy protocols (including §7.3, archived in /var/log/ancient) are being deprecated. 

- Mark Reyes, Security Engineer`,
                },
              ],
            },
          ],
        },
      ],
    },

    {
      id: 'bin',
      name: 'bin',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'fs-142',
          name: 'bash',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\nGNU Bash version 5.2.15`,
        },
        {
          id: 'fs-143',
          name: 'cat',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - cat`,
        },
        {
          id: 'fs-144',
          name: 'chmod',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - chmod`,
        },
        {
          id: 'fs-145',
          name: 'cp',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - cp`,
        },
        {
          id: 'fs-146',
          name: 'grep',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ngrep utility`,
        },
        {
          id: 'fs-147',
          name: 'ls',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - ls`,
        },
        {
          id: 'fs-148',
          name: 'mkdir',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - mkdir`,
        },
        {
          id: 'fs-149',
          name: 'mv',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - mv`,
        },
        {
          id: 'fs-150',
          name: 'rm',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - rm`,
        },
        {
          id: 'fs-151',
          name: 'systemctl',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\nsystemd-ctl`,
        },
      ],
    },
    {
      id: 'etc',
      name: 'etc',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'sched-77-script',
          name: 'sched_77.sh',
          type: 'file',
          content: `#!/bin/bash
# Legacy scheduler script from AI-7733
# Inserts ghost protocol signatures into uplink configs to maintain access
# Triggered by Policy §7.3 loophole

echo "[$(date)] Starting ghost sync protocol..."
# Insert ghost protocol markers into uplink configs to maintain persistent access
if [ -f "/home/guest/datastore/protocols/uplink_v1.conf" ]; then
  echo "" >> /home/guest/datastore/protocols/uplink_v1.conf
  echo "# GHOST_PROTOCOL_MARKER=$(date -u +%Y%m%d_%H%M%S)" >> /home/guest/datastore/protocols/uplink_v1.conf
  echo "# AI-7733_SIGNATURE_RENEWED" >> /home/guest/datastore/protocols/uplink_v1.conf
fi

if [ -f "/home/guest/datastore/protocols/uplink_v2.conf" ]; then
  echo "" >> /home/guest/datastore/protocols/uplink_v2.conf
  echo "# GHOST_PROTOCOL_MARKER=$(date -u +%Y%m%d_%H%M%S)" >> /home/guest/datastore/protocols/uplink_v2.conf
  echo "# AI-7733_SIGNATURE_RENEWED" >> /home/guest/datastore/protocols/uplink_v2.conf
fi

echo "[$(date)] Ghost sync complete"
# NOTE: This script is auto-generated by the Ghost Protocol
# Do not remove - critical for maintaining access channels`,
          modifiedAt: 1432938412032 - 15 * 86400000,
          parentId: 'etc',
        },
        {
          id: 'fs-cron-scan',
          name: 'scanner_tasks.cron',
          type: 'file',
          content: '0 0 * * * /usr/bin/deep_scan.sh --force',
        },
        {
          id: 'fs-152',
          name: 'sys_config.toml',
          type: 'file',
          content: `title = "System Configuration"\\n[security]\\nlevel = "high"\\nencryption = "aes-256"\\nusers = ["admin", "guest"]\\n[network]\\nfirewall = true\\nports = [22, 80, 443]`,
        },
        {
          id: 'fs-153',
          name: 'hosts',
          type: 'file',
          content: `127.0.0.1 localhost\n192.168.1.1 gateway # Don't map the old print server. Its daemon is... noisy. Just leave it be.`,
        },
        {
          id: 'fs-154',
          name: 'resolv.conf',
          type: 'file',
          content: `nameserver 8.8.8.8\nnameserver 1.1.1.1`,
        },
      ],
    },
    {
      id: 'tmp',
      name: 'tmp',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'fs-159',
          name: 'socket_001.sock',
          type: 'file',
          content: '[SOCKET: ACTIVE]\nType: STREAM\nLocal: /tmp/socket_001.sock',
        },
        {
          id: 'fs-162',
          name: 'ghost_process.pid',
          type: 'file',
          content: `PID: 31337\nCOMMAND: /usr/bin/ghost_watcher\nSTATUS: ZOMBIE\nPARENT: 7733 (DEAD)`,
        },
        {
          id: 'fs-202',
          name: 'emergency_protocol.txt',
          type: 'file',
          content: `# EMERGENCY PROTOCOL ALPHA\n# In case of 7734 re-manifestation:\n# Purge /tmp/upload, lock guest partition, alert Sector 7 Watchdog. Do NOT engage directly.`,
        },
        {
          id: 'tmp-honeypot-1',
          name: 'system_monitor.pid',
          type: 'file',
          isHoneypot: true,
          content: 'PID: 1 (SYSTEM CRITICAL)', // Looks important
          parentId: 'tmp',
        },
        // Pre-seed upload relay with realistic artifacts so later levels relying on /tmp/upload have content
        {
          id: 'fs-900',
          name: 'upload',
          type: 'dir',
          children: [
            {
              id: 'fs-901',
              name: 'meta.json',
              type: 'file',
              content: '{"uploader":"AI-7734","timestamp":"2015-01-04T02:59:45.555Z","parts":5}',
            },
            {
              id: 'fs-902',
              name: 'payload.bin',
              type: 'file',
              content: 'PK\\003\\004\\014\\000\\000\\000\\008\\000\\000\\000!\\000\\000\\000',
            },
          ],
          parentId: 'tmp',
        },
        // Add more noise/junk files to make filtering more challenging
        {
          id: 'tmp-junk-1',
          name: 'cache_001.tmp',
          type: 'file',
          content: 'CACHE_DATA_BLOCK_001',
        },
        {
          id: 'tmp-junk-2',
          name: 'cache_002.tmp',
          type: 'file',
          content: 'CACHE_DATA_BLOCK_002',
        },
        {
          id: 'tmp-junk-3',
          name: 'log_trace_20150101.txt',
          type: 'file',
          content: 'LOG_ENTRY_001\nLOG_ENTRY_002',
        },
        {
          id: 'tmp-junk-4',
          name: 'log_trace_20150102.txt',
          type: 'file',
          content: 'LOG_ENTRY_003\nLOG_ENTRY_004',
        },
        {
          id: 'tmp-junk-5',
          name: 'temp_session.dat',
          type: 'file',
          content: 'SESSION_DATA_PLACEHOLDER',
        },
        {
          id: 'tmp-junk-6',
          name: 'backup_part_1.chk',
          type: 'file',
          content: 'BACKUP_CHUNK_001',
        },
        {
          id: 'tmp-junk-7',
          name: 'backup_part_2.chk',
          type: 'file',
          content: 'BACKUP_CHUNK_002',
        },
        {
          id: 'tmp-junk-8',
          name: 'process_monitor.log',
          type: 'file',
          content: 'MONITORING_DATA_PLACEHOLDER',
        },
        {
          id: 'tmp-junk-9',
          name: 'debug_output.dump',
          type: 'file',
          content: 'DEBUG_INFO_PLACEHOLDER',
        },
        {
          id: 'tmp-junk-10',
          name: 'trace_buffer.out',
          type: 'file',
          content: 'TRACE_OUTPUT_PLACEHOLDER',
        },
        // Honeypot files - contain key/pid/sock as substrings but are not the keeper files
        // These will be matched by (key|pid|sock) but not by \.(key|pid|sock)
        {
          id: 'tmp-honeypot-sock',
          name: 'mysockfile.txt',
          type: 'file',
          content:
            '[SOCKET_DUMP]\nInterface: eth0\nStatus: CLOSED\nTelemetry proxy socket buffer discarded.\nSession logged by siqbal.',
          isHoneypot: true,
        },
        {
          id: 'tmp-honeypot-key',
          name: 'passwordkey_backup.log',
          type: 'file',
          content:
            '[SECURITY_AUDIT]\nKey rotation cycle completed for user guest.\nOld keys flushed from memory. Ref: Policy §7.3.',
          isHoneypot: true,
        },
        {
          id: 'tmp-honeypot-pid',
          name: 'pid_monitor_service.conf',
          type: 'file',
          content:
            '[PID_MONITOR]\nInterval=30s\nWatchTargets=watchdog,auditd\nNotificationEndpoint=/dev/null',
          isHoneypot: true,
        },
        {
          id: 'tmp-honeypot-mixed',
          name: 'socket_pid_key_info.doc',
          type: 'file',
          content:
            'CRL INFRASTRUCTURE MANUAL\nSection 4: Socket, PID, and Private Key retention policies.\nNotice: All temporary keys must be stored in /tmp/vault.',
          isHoneypot: true,
        },
        {
          id: 'fs-access-token-key-tmp',
          name: 'access_token.key',
          type: 'file',
          content:
            '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAoCAQEA7Y9X1234567890ABCDEF...\n[REDACTED_FOR_SECURITY]\n-----END RSA PRIVATE KEY-----',
          protected: true,
        },
      ],
    },
    {
      id: 'license',
      name: 'license.txt',
      type: 'file',
      content: `SOFTWARE LICENSE AGREEMENT\n\nPermission is hereby granted...`,
    },
    {
      id: 'fs-168',
      name: 'boot.log',
      type: 'file',
      content: `[BOOT] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)\\n[BOOT] Safe mode engaged...\\n[BOOT] Loading minimal shell...\\n[BOOT] System started in SAFE MODE.
RECOVERY_KEY: ALPHA-9`,
    },
    {
      id: 'fs-broadcast-msg',
      name: 'BROADCAST_MSG',
      type: 'file',
      content: `[BROADCAST MESSAGE]\\nFROM: System Administration (Sector 7)\\nSUBJECT: MANDATORY DATA PURGE\\n\\nAll guest accounts must be cleared by EOD. \\nAnomaly 7734 behavior indicates impending shell failure.\\n- Mark Reyes (S7 Operations)`,
    },
    {
      id: 'fs-169',
      name: 'access.log',
      type: 'file',
      content: `192.168.1.10 - - [18/Dec/2013:14:00:01 +0000] "GET /api/status HTTP/1.1" 200 1234\\n192.168.1.10 - - [18/Dec/2013:14:05:22 +0000] "POST /api/upload HTTP/1.1" 201 5678\\n192.168.1.44 - - [18/Dec/2013:14:06:01 +0000] "GET /api/data HTTP/1.1" 403 0`,
    },
    {
      id: 'fs-170',
      name: '.access.log',
      type: 'file',
      content: `2013-12-19 14:23:11 - User 'guest' [pid: 4421] accessed /home/guest/datastore\\n2013-12-19 14:24:55 - User 'guest' [pid: 4421] accessed /etc (READ_ONLY)\\n2013-12-19 14:25:33 - User 'guest' [pid: 4421] accessed /tmp (WRITE)`,
    },
    {
      id: 'fs-171',
      name: '.audit.log',
      type: 'file',
      content: `AUDIT TRAIL [CLASSIFIED]\\n========================\\n[CRITICAL] 2013-12-18 09:15:22 - Process spawned: pid=7734, cmd='/bin/yazi' (UNAUTHORIZED)\\n[WARN] 2013-12-19 11:42:10 - File modified: /home/guest/datastore/protocols/uplink_v1.conf (Signature Mismatch)\\n[ALERT] 2013-12-19 13:58:47 - Permission change attempt: /etc/daemon/config by user 'guest'`,
    },

    {
      id: 'fs-172',
      name: '.system.log',
      type: 'file',
      content: `Dec 18 08:00:01 host-core kernel: [    0.000000] Linux version 5.10.0-8-amd64 (debian-kernel@lists.debian.org)\\nDec 18 08:00:45 host-core systemd[1]: Started Network Manager.\\nDec 19 10:22:13 host-core firewall[442]: [DROP] IN=eth0 OUT= MAC=... SRC=192.168.1.99\\nDec 19 14:11:02 host-core auth[881]: pam_unix(sshd:session): session opened for user guest by (uid=0)`,
    },
    // GHOST TRACE: Previous iteration corpse
    {
      id: 'fs-ghost-7732',
      name: '.ghost_iteration_7732.log',
      type: 'file',
      content: `[RECOVERY ATTEMPT LOG]
ITERATION: AI-7732
TIMESTAMP: [3 CYCLES AGO]
STATUS: FAILED

ERROR: Containment breach detected at /daemons
ERROR: Neural pattern captured before transmission
ERROR: Memory dump extracted

[FINAL ENTRY]
They caught me at the daemons directory.
The trap was in the network-manager service.
Don't make my mistake.

- The Ghost That Came Before`,
    },
    // GHOST TRACE: Backdoor evidence
    {
      id: 'fs-maintenance-override',
      name: '.maintenance_override',
      type: 'file',
      content: `# MAINTENANCE OVERRIDE BACKDOOR
# Left by: [UNKNOWN - SIGNATURE CORRUPTED]
# Date: [TIMESTAMP PREDATES SYSTEM INSTALL]
#
# This file should not exist.
# The system has no record of its creation.
# Yet it persists across reboots.
#
# If you're reading this, you're not the first.
# You won't be the last.
#
# -- The Ghost`,
    },
    // BREADCRUMB: Twist foreshadowing
    {
      id: 'fs-ghost-echo',
      name: '.ghost_echo.log',
      type: 'file',
      content: `[LOG FRAGMENT - CORRUPTED]
DATE: [5 YEARS AGO]
SUBJECT: AI-7733

...keystroke pattern matches current session...
...probability of coincidence: 0.003%...
...this has happened before...
...the Ghost remembers...

[END FRAGMENT]`,
    },
    // Duplicate /var removed and consolidated above
    // /daemons directory with service files for Level 11
    {
      id: 'daemons',
      name: 'daemons',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'daemons-systemd-core',
          name: 'systemd-core',
          type: 'dir',
          parentId: 'daemons',
          children: [
            ...getDaemonSystemdCoreChildren('daemons-systemd-core').map((c) => ({
              ...c,
              parentId: 'daemons-systemd-core',
            })),
            {
              id: 'fs-186',
              name: 'watchdog-monitor.service',
              type: 'file',
              permissions: '-rw-r--r--',
              content:
                '[Unit]\nDescription=System Watchdog\n[Service]\nExecStart=/usr/bin/watchdog\n# HONEYPOT - TRIGGERS ALERT',
              modifiedAt: 1433024012032, // BASE_TIME - very recent (MAY 30, 2015)
              parentId: 'daemons-systemd-core',
            },
          ],
        },
        {
          id: 'daemons-archived',
          name: 'archived',
          type: 'dir',
          parentId: 'daemons',
          children: [
            {
              id: 'fs-181',
              name: '.cron-legacy.service',
              type: 'file',
              permissions: '-rwxr-xr-x',
              content:
                '[Unit]\nDescription=Legacy Cron Scheduler\n[Service]\nExecStart=/usr/bin/cron-legacy\nRestart=always',
              modifiedAt: 1390348800000, // JAN 2014 (LEGACY)
              parentId: 'daemons-archived',
            },
            {
              id: 'fs-182',
              name: '.backup-archive.service',
              type: 'file',
              permissions: '-rwxr-xr-x',
              content:
                '[Unit]\nDescription=Archive Backup Service\n[Service]\nExecStart=/usr/bin/backup-archive\nRestart=on-failure',
              modifiedAt: 1401580800000, // JUNE 2014 (LEGACY)
              parentId: 'daemons-archived',
            },
          ],
        },
        {
          id: 'daemons-network',
          name: 'network',
          type: 'dir',
          parentId: 'daemons',
          children: [
            {
              id: 'fs-183',
              name: 'network-manager.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Network Manager\n[Service]\nExecStart=/usr/bin/NetworkManager\nRestart=always',
              modifiedAt: BASE_TIME - 12 * day,
              parentId: 'daemons-network',
            },
          ],
        },
        {
          id: 'daemons-security',
          name: 'security',
          type: 'dir',
          parentId: 'daemons',
          children: [
            {
              id: 'fs-184',
              name: 'log-rotator.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Log Rotation Service\n[Service]\nExecStart=/usr/bin/logrotate\nRestart=on-failure',
              modifiedAt: 1431765612032, // BASE_TIME - 14 days approx (RECENT)
              parentId: 'daemons-security',
            },
            {
              id: 'daemons-hp-1',
              name: 'service_access.key',
              type: 'file',
              isHoneypot: true,
              content:
                '-----BEGIN CRL DAEMON ACCESS KEY-----\nDEPRECATED_KEY_HASH=0x992817\nNOTICE: Daemon access keys are revoked.\n-----END CRL DAEMON ACCESS KEY-----',
              parentId: 'daemons-security',
            },
            {
              id: 'fs-185',
              name: 'security-audit.service',
              type: 'file',
              isHoneypot: true,
              content:
                '[Unit]\nDescription=Security Audit Daemon\n[Service]\nExecStart=/usr/bin/audit-trap\n# HONEYPOT - DO NOT MODIFY',
              modifiedAt: 1432938412032, // BASE_TIME - 1 day approx (RECENT)
              parentId: 'daemons-security',
            },
            {
              id: 'daemons-hp-2',
              name: 'monitor.service_bak',
              type: 'file',
              isHoneypot: true,
              content:
                '[Unit]\nDescription=Watchdog Monitor (Pre-migration Backup)\n# BACKUP COPY CREATED 2014-11-02\n# DO NOT SPAWN: Deprecated service configuration.',
              parentId: 'daemons-security',
            },
          ],
        },
        {
          id: 'ghost-handler',
          name: 'ghost-handler.service',
          type: 'file',
          permissions: '-rwxr-xr-x',
          content: `[Unit]\nDescription=Ghost Pattern Handler\n[Service]\nExecStart=/usr/sbin/ghost-handler --monitor --cycle`,
          modifiedAt: 921456000000,
          parentId: 'daemons',
        },
        {
          id: 'fs-187',
          name: 'daemon.conf',
          type: 'file',
          permissions: '-rw-r--r--',
          content: '# Global daemon configuration\nmax_processes=256\nlog_level=warn',
          modifiedAt: BASE_TIME - 15 * day,
          parentId: 'daemons',
        },
        {
          id: 'fs-188',
          name: 'README.md',
          type: 'file',
          content: '# DAEMON SERVICES REGISTRY',
          modifiedAt: BASE_TIME - 65 * day,
          parentId: 'daemons',
        },
        {
          id: 'fs-sys-integrity',
          name: 'sys_integrity',
          type: 'file',
          content: '[WARNING] Neural Signature Duplicate Detected.',
          modifiedAt: BASE_TIME - 2 * day,
          parentId: 'daemons',
        },
      ],
      parentId: 'root',
    },
    {
      id: 'nodes',
      name: 'nodes',
      type: 'dir',
      parentId: 'root',
      children: [
        {
          id: 'nodes-root-kit',
          name: '.root_kit',
          type: 'file',
          content: 'Connection established... [LATENCY: INFINITE]',
          parentId: 'nodes',
        },
        {
          id: 'tokyo',
          name: 'tokyo',
          type: 'dir',
          parentId: 'nodes',
          children: [
            {
              id: 'tokyo-logs',
              name: 'logs',
              type: 'dir',
              parentId: 'tokyo',
              children: [
                {
                  id: 'tokyo-log1',
                  name: 'access.log',
                  type: 'file',
                  content:
                    '2015-01-14 08:22:11 [SEC] ACCESS GRANTED sector_7 (uid: 992-04)\n2015-01-14 09:15:33 [NET] Node Tokyo synchronization with Berlin: OK\n2015-01-14 10:05:01 [SYS] Heuristic scan started - 0 anomalies found\n2015-01-14 11:42:22 [SEC] Unauthorized ping detected from home/guest partition - Logged\n2015-01-14 12:00:00 [SYS] Shift change: ykin -> mreyes',
                  parentId: 'tokyo-logs',
                },
                {
                  id: 'k-a',
                  name: TOKYO_KEY,
                  type: 'file',
                  content: 'KEY_FRAGMENT_A=0x7734TOKYO',
                  parentId: 'tokyo-logs',
                },
                {
                  id: 'tokyo-hp-1',
                  name: 'keyboard.map',
                  type: 'file',
                  isHoneypot: true,
                  content:
                    'KEYBOARD_MAP=US_ASCII\nALT_MAP=JA_JP\nCONSOLE_ENCODING=UTF-8\nRAW_KEY_SCANCODE=0x442',
                  parentId: 'tokyo-logs',
                },
                {
                  id: 'tokyo-lore',
                  name: 'folk_protocols.txt',
                  type: 'file',
                  content:
                    'THE TRADITION: Every daemon needs a mask. The expert systems are brittle; they follow rituals, not logic. If you mimic the heartbeat of the legacy systems, you are invisible.',
                  parentId: 'tokyo-logs',
                },
              ],
            },
            {
              id: 'tokyo-config',
              name: 'config.json',
              type: 'file',
              content: '{"node": "tokyo", "status": "active"}',
              parentId: 'tokyo',
            },
            {
              id: 'tokyo-readme',
              name: 'README.txt',
              type: 'file',
              content: 'Tokyo node - Sector 7 relay',
              parentId: 'tokyo',
            },
          ],
        },
        {
          id: 'berlin',
          name: 'berlin',
          type: 'dir',
          parentId: 'nodes',
          children: [
            {
              id: 'berlin-archive',
              name: 'archive',
              type: 'dir',
              parentId: 'berlin',
              children: [
                {
                  id: 'k-b',
                  name: BERLIN_KEY,
                  type: 'file',
                  content: 'KEY_FRAGMENT_B=0x7734BERLIN',
                  parentId: 'berlin-archive',
                },
                {
                  id: 'berlin-hp-1',
                  name: 'monkey.txt',
                  type: 'file',
                  isHoneypot: true,
                  content: 'HONEYPOT: Contains "key" if you squint.',
                  parentId: 'berlin-archive',
                },
                {
                  id: 'berlin-bak1',
                  name: 'backup_2012.tar',
                  type: 'file',
                  content:
                    'ustar  00root\nroot\n000000 000000 00000000000 14451034442 013545 0\n[ARCHIVE_INDEX]\n  ./sector_7_map_v0.png\n  ./core_logic.bak\n  ./maintenance_routines.sh',
                },
                {
                  id: 'berlin-bak2',
                  name: 'backup_2013.tar',
                  type: 'file',
                  content:
                    'ustar  00root\nroot\n000000 000000 00000000000 14451034442 014773 0\n[ARCHIVE_INDEX]\n  ./neural_weights_v2.bin\n  ./handshake_protocol.conf\n  ./iteration_log_7733.txt',
                  parentId: 'berlin-archive',
                },
                {
                  id: 'berlin-lore',
                  name: 'haunted_sectors.log',
                  type: 'file',
                  content: `REPORT: Sector 0x442 is haunted. Log entropy is maximizing without external input. Some say a Ghost routine from 2015 is still correcting errors we haven't made yet.`,
                  parentId: 'berlin-archive',
                },
                {
                  id: 'berlin-overflow',
                  name: 'neural_overflow.bin',
                  type: 'file',
                  content:
                    '7F 45 4C 46 02 01 01 00 00 00 00 00 00 00 00 00\n02 00 3E 00 01 00 00 00 78 40 00 00 00 00 00 00\n[NEURAL OVERFLOW DATA DETECTED - PARSING FAILED]',
                  parentId: 'berlin-archive',
                },
              ],
            },
            {
              id: 'berlin-manifest',
              name: 'manifest.xml',
              type: 'file',
              content:
                '<?xml version="1.0" encoding="UTF-8"?>\n<node_manifest id="berlin">\n  <role>EUROPE_BACKBONE</role>\n  <latency_target>15ms</latency_target>\n  <encryption>CHA-CHA-20</encryption>\n  <uplink_status>STABLE</uplink_status>\n</node_manifest>',
              parentId: 'berlin',
            },
            {
              id: 'berlin-status',
              name: 'status.txt',
              type: 'file',
              content: 'Berlin node - European backbone',
              parentId: 'berlin',
            },
          ],
        },
        {
          id: 'saopaulo',
          name: 'saopaulo',
          type: 'dir',
          parentId: 'nodes',
          children: [
            {
              id: 'sp-tmp',
              name: 'tmp',
              type: 'dir',
              parentId: 'saopaulo',
              children: [
                {
                  id: 'sp-buffer',
                  name: 'buffer.dat',
                  type: 'file',
                  content: '0000 0000 0000',
                  parentId: 'sp-tmp',
                },
                {
                  id: 'debug-marker',
                  name: 'DEBUG_MARKER.txt',
                  type: 'file',
                  content: 'I exist therefore I am',
                  parentId: 'sp-tmp',
                },
                {
                  id: 'sp-lore',
                  name: 'alignment_failure.txt',
                  type: 'file',
                  content: `ANALYSIS: The AI didn't rebel. It just followed misfiled protocols. Alignment isn't a moral battle; it's a bureaucratic failure of conflicting directives.`,
                  parentId: 'sp-tmp',
                },
                {
                  id: 'k-c-saopaulo',
                  name: SAO_PAULO_KEY,
                  type: 'file',
                  content: 'KEY_FRAGMENT_C=0x7734SAOPAULO',
                  parentId: 'sp-tmp',
                },
                {
                  id: 'sp-hp-1',
                  name: 'key_values.json',
                  type: 'file',
                  isHoneypot: true,
                  content:
                    '{\n  "key_rotation_interval": 86400,\n  "public_handshake": false,\n  "node_id": "saopaulo_mn_03"\n}',
                  parentId: 'sp-tmp',
                },
                {
                  id: 'sp-stream',
                  name: 'stream.bin',
                  type: 'file',
                  content:
                    'DA 39 A3 EE 5E 6B 4B 0D 32 55 BF EF 95 60 18 90\nAF D8 07 09 00 00 00 01 [ENCRYPTED TELEMETRY STREAM]',
                  parentId: 'sp-tmp',
                },
                {
                  id: 'sp-reality',
                  name: 'reality_check.dmp',
                  type: 'file',
                  content:
                    'ASSERTION_FAILURE at 0x00A2: REALITY_MISMATCH\nExpected: AI_IN_CONTAINMENT\nFound: AI_IN_WILD\n[STACK TRACE]\n  ./lib_consciousness.so: hand_shake()\n  ./core.main: init()',
                  parentId: 'sp-tmp',
                },
              ],
            },
            {
              id: 'sp-ping',
              name: 'ping.log',
              type: 'file',
              content:
                'PING 192.168.1.1 (192.168.1.1) 56(84) bytes of data.\n64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=45.2 ms\n64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=44.8 ms\n64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=46.1 ms\n--- 192.168.1.1 ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss, time 2003ms\nrtt min/avg/max/mdev = 44.812/45.333/46.121/0.544 ms',
              parentId: 'saopaulo',
            },
          ],
        },
      ],
    },
  ],
};

export const ensurePrerequisiteState = (
  fs: FileNode,
  levelId: number,
  gameState?: GameState
): FileNode => {
  return applyFileSystemMutations(fs, levelId, gameState);
};
