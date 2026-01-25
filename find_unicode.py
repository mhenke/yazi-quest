import sys

with open('src/constants.tsx', 'rb') as f:
    content = f.read()
    pos = content.find(b'\\u')
    if pos != -1:
        # Show some context
        context = content[max(0, pos-10):pos+50]
        print(f"Found \\u at position {pos}")
        print(f"Context: {context}")
        # Find line number
        line_no = content[:pos].count(b'\n') + 1
        print(f"Line number: {line_no}")
    else:
        print("Not found")
