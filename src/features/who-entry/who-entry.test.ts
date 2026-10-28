import assert from "node:assert/strict";
import test from "node:test";
import {
  WHO_ENTRY_ENABLED,
  WHO_ENTRY_EMPTY,
  WHO_ENTRY_LABEL,
  WHO_ENTRY_SEARCH,
  filterWhoNames,
  whoEntryLabel,
  whoEntryOn,
  whoPickedLine,
} from "@/features/who-entry/who-entry";
import { copyIsClean } from "@/lib/wave-d";

test("guests see the labeled 我是谁 entry until a name is chosen", () => {
  assert.equal(WHO_ENTRY_ENABLED, true);
  assert.equal(whoEntryOn(), true);
  assert.equal(whoEntryOn(false), false);
  assert.equal(whoEntryLabel(false), WHO_ENTRY_LABEL);
  assert.ok(WHO_ENTRY_LABEL.includes("我是谁"));
  assert.equal(whoEntryLabel(true), "我是谁");
  assert.equal(whoEntryLabel(false, false), "我是谁");
});

test("picking a name confirms with the display name only", () => {
  assert.equal(whoPickedLine("林小满"), "已选定：林小满");
  assert.equal(whoPickedLine(null), null);
  assert.equal(copyIsClean([WHO_ENTRY_LABEL, WHO_ENTRY_SEARCH, WHO_ENTRY_EMPTY]), true);
});

test("the name filter narrows a long roster without reordering it", () => {
  const names = ["林小满", "周晚风", "苏星河", "Amy Lin", "林间"];
  assert.deepEqual(filterWhoNames(names, ""), names);
  assert.deepEqual(filterWhoNames(names, "  "), names);
  assert.deepEqual(filterWhoNames(names, "林"), ["林小满", "林间"]);
  assert.deepEqual(filterWhoNames(names, "amy"), ["Amy Lin"]);
  assert.deepEqual(filterWhoNames(names, "不在"), []);
});
