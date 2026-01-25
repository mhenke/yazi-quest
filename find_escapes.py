import sys

with open('src/constants.tsx', 'rb') as f:
    content = f.read()
    escapes = {}
    for i in range(len(content)-1):
        if content[i] == ord('\\'):
            char = chr(content[i+1])
            escapes[char] = escapes.get(char, 0) + 1
            if char not in "nr'\"\\btvfx01234567":
                line_no = content[:i].count(b'\n') + 1
                col_no = i - content.rfind(b'\n', 0, i)
                print(f"Strange escape \\{char} at L{line_no}, Col {col_no}")

print("All escapes found:", escapes)
