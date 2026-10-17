#!/usr/bin/env bash
# Mutation check for the renderer: injects known bugs into packages/core/src/lib/teact/teact-dom.ts one at a time,
# runs the test suites against each mutant and prints which suites catch it. Every mutant must be caught.
#
# Usage: scripts/mutate-teact-dom.sh [--suites unit,browser,e2e] [mutant...]
#
#   --suites   Suites to run against each mutant (default: all three). `browser` uses the browsers in
#              TEACT_BROWSERS (default: chromium); `e2e` rebuilds the package for every mutant.
#   mutant     Names from MUTANTS below (default: all).
#
# Each suite first runs once on the unmodified source and must pass. A mutant counts as caught by a suite only when
# tests in it fail (its summary reports failed tests), not when the suite cannot run at all.
# The source file is restored afterwards, also when a suite fails or the script is interrupted, and the package is
# rebuilt if the e2e suite built it from a mutant.
# Exits with 1 when a mutant survives every suite, and with 2 when a suite fails without a mutant, cannot run, or a
# mutant no longer applies.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
FILE="$ROOT/packages/core/src/lib/teact/teact-dom.ts"
LOG_DIR="$ROOT/test-results/mutations"

MUTANTS=(
  M1_fragment_placeholder_pos
  M2_remount_nextsibling
  M3_textcontent_guard
  M4_refs_noop
  M5_fastlist_no_move
  M6_ref_no_cleanup_on_reuse
)

suites=(unit browser e2e)
selected=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --suites) IFS=',' read -r -a suites <<< "$2"; shift 2 ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) selected+=("$1"); shift ;;
  esac
done
[[ ${#selected[@]} -gt 0 ]] || selected=("${MUTANTS[@]}")

apply_mutant() {
  case "$1" in
    M1_fragment_placeholder_pos)
      # An empty fragment that gets children again forgets its placeholder's position (reverts telegram-tt f21ca5233)
      perl -0pi -e 's/nextSibling = currentFragment\.placeholderTarget\.nextSibling \|\| undefined;/\/\/ MUTATED/' "$FILE" ;;
    M2_remount_nextsibling)
      # Content that replaces an element of another type forgets its position (appended to the parent's end)
      perl -0pi -e 's/if \(!nextSibling\) \{\n        nextSibling = getNextSibling\(\$current\);\n      \}/\/\/ MUTATED/' "$FILE" ;;
    M3_textcontent_guard)
      # A single text child may overwrite its parent's other content (reverts telegram-tt 7daee68c0)
      perl -0pi -e 's/\n        && !parentEl\.firstChild;/;/' "$FILE" ;;
    M4_refs_noop)
      # Refs are never assigned or cleared
      perl -0pi -e 's/(function setElementRef\(\$element: VirtualElementTag, element: DOMElement \| undefined\) \{\n)/$1  return;\n/' "$FILE" ;;
    M5_fastlist_no_move)
      # Fast lists never move preserved nodes
      perl -0pi -e 's/const shouldMoveNode = \(/const shouldMoveNode = false \&\& (/' "$FILE" ;;
    M6_ref_no_cleanup_on_reuse)
      # A reused DOM node keeps the ref of the element it was rendered for before
      perl -0pi -e 's/          setElementRef\(\$current, undefined\);\n//' "$FILE" ;;
    *)
      echo "Unknown mutant: $1" >&2; return 2 ;;
  esac
}

run_suite() {
  case "$1" in
    unit) npm run test:unit --prefix "$ROOT" ;;
    browser) npm run test:browser --prefix "$ROOT" ;;
    # CI=1 starts a fresh server (which rebuilds the package) for every mutant instead of reusing a running one
    e2e) (cd "$ROOT/e2e" && CI=1 npx playwright test --retries=0 --reporter=line) ;;
    *) echo "Unknown suite: $1" >&2; return 2 ;;
  esac
}

# The number of failed tests that a suite's log reports (Vitest: "Tests  2 failed | …", Playwright: "  2 failed"),
# or nothing when it reports none
count_failed_tests() {
  perl -pe 's/\e\[[0-9;]*m//g' "$1" | grep -Eo '^[[:space:]]*(Tests[[:space:]]+)?[0-9]+ failed' | grep -Eo '[0-9]+' \
    | head -n 1 || true
}

BACKUP=$(mktemp)
cp "$FILE" "$BACKUP"
has_built_mutant=0
cleanup() {
  cp "$BACKUP" "$FILE"
  rm -f "$BACKUP"
  # The e2e web server builds packages/core/dist (and the fixtures app) from the mutated source
  if [[ $has_built_mutant -eq 1 ]]; then
    echo "Rebuilding @teact/core from the restored source (log: ${LOG_DIR#"$ROOT"/}/rebuild.log)"
    rm -rf "$ROOT/e2e/dist"
    npm run build --prefix "$ROOT" > "$LOG_DIR/rebuild.log" 2>&1 \
      || echo "The rebuild failed; run \`npm run build\` before using packages/core/dist." >&2
  fi
}
trap cleanup EXIT
mkdir -p "$LOG_DIR"

for suite in "${suites[@]}"; do
  log="$LOG_DIR/baseline.$suite.log"
  echo "[baseline] running $suite (log: ${log#"$ROOT"/})"
  if ! run_suite "$suite" > "$log" 2>&1; then
    echo "The $suite suite fails without a mutant, so mutants cannot be checked with it; see ${log#"$ROOT"/}." >&2
    exit 2
  fi
done

declare -a rows
survived=0
errored=0

for mutant in "${selected[@]}"; do
  cp "$BACKUP" "$FILE"
  apply_mutant "$mutant"
  if cmp -s "$FILE" "$BACKUP"; then
    echo "Mutant $mutant does not apply to $FILE any more; update its pattern." >&2
    exit 2
  fi

  row="$mutant"
  caught=0
  for suite in "${suites[@]}"; do
    log="$LOG_DIR/$mutant.$suite.log"
    echo "[$mutant] running $suite (log: ${log#"$ROOT"/})"
    [[ $suite != e2e ]] || has_built_mutant=1
    if run_suite "$suite" > "$log" 2>&1; then
      row+=" | passed (missed)"
    else
      failed=$(count_failed_tests "$log")
      if [[ -n $failed && $failed -gt 0 ]]; then
        row+=" | $failed FAILED (caught)"
        caught=1
      else
        row+=" | ERROR (no test failed; see log)"
        errored=1
      fi
    fi
  done

  if [[ $caught -eq 1 ]]; then
    row+=" | caught"
  else
    row+=" | SURVIVED"
    survived=1
  fi
  rows+=("$row")
done

echo
echo "mutant | $(IFS='|'; echo "${suites[*]}" | sed 's/|/ | /g') | result"
for row in "${rows[@]}"; do
  echo "$row"
done

if [[ $errored -eq 1 ]]; then
  echo "A suite could not run against a mutant; see its log." >&2
  exit 2
fi
exit $survived
