import sys

with open('src/constants.tsx', 'rb') as f:
    content = f.read()
    for i in range(len(content)-1):
        if content[i] == 92 and content[i+1] == 117: # \u
            # Check if it's followed by 4 hex digits
            hex_part = content[i+2:i+6]
            is_valid = len(hex_part) == 4 and all(c in b'0123456789abcdefABCDEF' for c in hex_part)
            
            line_no = content[:i].count(b'\n') + 1
            col_no = i - content.rfind(b'\n', 0, i)
            
            print(f"Match found at L{line_no}, Col {col_no}: \\u{hex_part.decode('ascii', errors='ignore')}")
            if not is_valid:
                print(">>> THIS IS MALFORMED!")
