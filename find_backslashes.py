import sys
import re

with open('src/constants.tsx', 'rb') as f:
    content = f.read()
    # Find all occurrences of \ followed by any character
    matches = list(re.finditer(b'\\\\', content))
    for m in matches:
        pos = m.start()
        context = content[pos:pos+10]
        # Find line number
        line_no = content[:pos].count(b'\n') + 1
        print(f"L{line_no} at {pos}: {context}")
