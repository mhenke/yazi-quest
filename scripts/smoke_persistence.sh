#!/usr/bin/env bash
set -eu

passed=0
failed=0

check() {
  desc="$1"
  cmd="$2"
  printf "%-70s" "$desc"
  if bash -c "$cmd" >/dev/null 2>&1; then
    echo "PASS"
    passed=$((passed+1))
  else
    echo "FAIL"
    failed=$((failed+1))
  fi
}

# 1. LevelProgress map jump preserves active FS
check "LevelProgress uses cloneFS(gameState.fs) for map jump" "grep -n \"cloneFS(gameState.fs)\" App.tsx || true"

# 2. Map jump guards onEnter with seedMode/isFresh check
check "Map jump guards onEnter with seedMode check" "grep -n \"target.seedMode\" App.tsx || true"

# 3. initialLevel.onEnter guarded with isFreshStart check
check "initialLevel.onEnter wrapped with isFreshStart check" "grep -n \"isFreshStart\" App.tsx || true"

# 4. advanceLevel onEnter guarded with seedMode/isFresh
check "advanceLevel onEnter guarded with seedMode" "grep -n \"nextLevel.seedMode\" App.tsx || grep -n \"isFresh\" App.tsx || true"

# 5. Level 11 seedMode set to 'fresh' in constants.tsx
check "Level 11 seedMode == 'fresh'" "awk '/id: 11,/{for(i=0;i<40;i++){if(getline){ if(\$0 ~ /seedMode: *\x27fresh\x27/) {exit 0}}}; exit 1}' constants.tsx"

# Summary

echo
echo "Smoke summary: $passed passed, $failed failed"
if [ "$failed" -ne 0 ]; then
  exit 2
fi
exit 0
