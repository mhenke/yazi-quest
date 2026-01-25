import sys

with open('src/constants.tsx', 'rb') as f:
    content = f.read()
    for i in range(len(content)):
        if content[i] == ord('\\'):
            next_char = chr(content[i+1]) if i+1 < len(content) else ''
            if next_char == 'u':
                # Check if it's followed by 4 hex digits
                hex_part = content[i+2:i+6].decode('ascii', errors='ignore')
                if not all(c in '0123456789abcdefABCDEF' for c in hex_part) or len(hex_part) < 4:
                    # Find line number
                    line_no = content[:i].count(b'\n') + 1
                    print(f"BINGO! Found malformed \\u at L{line_no}, col {i - content[:i].rfind(b'\12')}")
                    print(f"Context: {content[i:i+10]}")
