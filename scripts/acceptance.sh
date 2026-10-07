#!/usr/bin/env bash
# End-to-end check of the videos root: npm run acceptance
#
# Makes two fixture videos in a scratch root, voices them, lists the compositions, takes a
# still, renders a short clip and a contact sheet, then checks that every output is under
# the scratch root, that nothing new appeared in the checkout's videos/, out/ or public/,
# and that the render bundle's public folder was a symlink to the root, not a copy.
# The real root and config are never read: STUDIO_VIDEOS_DIR and XDG_CONFIG_HOME both point
# at the scratch folder, which is left in place and printed at the end.
set -euo pipefail
cd "$(dirname "$0")/.."

scratch=$(mktemp -d)
export STUDIO_VIDEOS_DIR="$scratch/root" XDG_CONFIG_HOME="$scratch/config"
root=$STUDIO_VIDEOS_DIR
fail() { echo "FAIL: $*" >&2; exit 1; }
checkout_files() { find videos out public -type f 2>/dev/null | sort || true; }
before=$(checkout_files)

npm run --silent new-video -- fixture-one >/dev/null
npm run --silent new-video -- fixture-two >/dev/null
npm run --silent voice -- fixture-one
npm run --silent voice -- fixture-two

compositions=$(npx remotion compositions --quiet)
for id in FixtureOne FixtureTwo; do
  grep -qw "$id" <<<"$compositions" || fail "compositions does not list $id: $compositions"
done

npm run --silent still -- fixture-one cover --frame=10

# The bundle lives in a temporary folder that the render deletes, so watch it while it exists.
mkdir -p "$scratch/tmp"
TMPDIR="$scratch/tmp" npm run --silent render -- fixture-one --frames=0-29 &
render=$!
while kill -0 "$render" 2>/dev/null; do
  # The render may delete the bundle between two tests, so a failed look is not an error.
  for public in "$scratch"/tmp/remotion-webpack-bundle-*/public; do
    if [ -L "$public" ]; then
      if link=$(readlink "$public"); then echo "$link" >"$scratch/public-link"; fi
    elif [ -d "$public" ]; then
      echo copy >"$scratch/public-link"
    fi
  done
  sleep 0.1
done
wait "$render"

npm run --silent sheet -- fixture-one

for file in fixture-one/audio/hook.wav fixture-two/audio/hook.wav fixture-one/out/cover.png \
  fixture-one/out/fixture-one.mp4 fixture-one/out/sheet.png tsconfig.json; do
  [ -s "$root/$file" ] || fail "missing $root/$file"
done
[ "$(checkout_files)" = "$before" ] || fail "new files in the checkout: $(diff <(echo "$before") <(checkout_files))"
[ -f "$scratch/public-link" ] || fail "never saw the render bundle's public folder"
[ "$(cat "$scratch/public-link")" = "$root" ] || fail "the bundle's public folder was $(cat "$scratch/public-link"), not a symlink to $root"

echo
echo "PASS: every output is under $root, the checkout gained no files,"
echo "and the render bundle's public folder was a symlink to the root."
echo "Scratch folder, left for inspection: $scratch"
