// node --test scripts/   Checks the arguments npm run render and npm run still pass to Remotion.
import assert from "node:assert/strict";
import { test } from "node:test";
import { remotionArgs } from "./remotion-args.mjs";

const env = { STUDIO_VIDEOS_DIR: "/scratch/root" };

test("render writes the slug's MP4 into its outputs folder", () => {
  assert.deepEqual(remotionArgs("render", ["fixture-one"], env), [
    "render",
    "FixtureOne",
    "/scratch/root/fixture-one/out/fixture-one.mp4",
  ]);
});

test("render passes other flags on to Remotion", () => {
  assert.deepEqual(
    remotionArgs(
      "render",
      ["fixture-one", "--frames=0-9", "--concurrency", "4"],
      env,
    ),
    [
      "render",
      "FixtureOne",
      "/scratch/root/fixture-one/out/fixture-one.mp4",
      "--frames=0-9",
      "--concurrency",
      "4",
    ],
  );
});

test("still writes a named PNG into the outputs folder", () => {
  assert.deepEqual(
    remotionArgs("still", ["fixture-one", "end-1", "--frame=40"], env),
    [
      "still",
      "FixtureOne",
      "/scratch/root/fixture-one/out/end-1.png",
      "--frame=40",
    ],
  );
});

test("still keeps an image extension the name already has", () => {
  assert.deepEqual(remotionArgs("still", ["fixture-one", "cover.jpeg"], env), [
    "still",
    "FixtureOne",
    "/scratch/root/fixture-one/out/cover.jpeg",
  ]);
});

test("still --sheet draws the video's asset sheet", () => {
  assert.deepEqual(
    remotionArgs("still", ["fixture-one", "sheet-assets", "--sheet"], env),
    [
      "still",
      "FixtureOneSheet",
      "/scratch/root/fixture-one/out/sheet-assets.png",
    ],
  );
});

test("a missing slug or still name is an error", () => {
  assert.throws(() => remotionArgs("render", [], env), /Usage: npm run render/);
  assert.throws(
    () => remotionArgs("still", ["fixture-one"], env),
    /Usage: npm run still/,
  );
  assert.throws(
    () => remotionArgs("still", ["fixture-one", "--frame=3"], env),
    /Usage: npm run still/,
  );
  assert.throws(
    () => remotionArgs("render", ["Not_A_Slug"], env),
    /Usage: npm run render/,
  );
});

test("a name with a folder in it is an error", () => {
  assert.throws(
    () => remotionArgs("still", ["fixture-one", "../escape"], env),
    /Usage: npm run still/,
  );
});
