import assert from "node:assert/strict";
import test from "node:test";
import {
  MAP_ROOM_ENABLED,
  MAP_ROOM_MIN_PX,
  headerLayoutPad,
  legendStartsClosed,
  mapKeepsRoom,
  mapRoomMark,
  mapRoomOn,
} from "@/features/map-room/map-room";

test("PV-PM-081 keeps the phone map at least 280px when chrome opens", () => {
  assert.equal(MAP_ROOM_ENABLED, true);
  assert.equal(mapRoomOn(), true);
  assert.equal(mapRoomOn(false), false);
  assert.equal(mapRoomMark(), "room");
  assert.equal(mapRoomMark(false), "off");
  assert.equal(MAP_ROOM_MIN_PX, 280);
  assert.equal(mapKeepsRoom(280), true);
  assert.equal(mapKeepsRoom(420), true);
  assert.equal(mapKeepsRoom(155), false);
  assert.equal(headerLayoutPad(72, 420), 72);
  assert.equal(headerLayoutPad(72, 420, false), 420);
  assert.equal(headerLayoutPad(0, 180), 180);
  assert.equal(legendStartsClosed(), true);
  assert.equal(legendStartsClosed(false), false);
});
