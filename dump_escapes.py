import sys

with open('src/constants.tsx', 'rb') as f:
    content = f.read()
    escapes = []
    for i in range(len(content)-1):
        if content[i] == ord('\\'):
            seq = content[i:i+6].decode('ascii', errors='ignore')
            escapes.append(seq)

unique_escapes = sorted(list(set(escapes)))
for ue in unique_escapes:
    print(f"Escape: {repr(ue)}")
