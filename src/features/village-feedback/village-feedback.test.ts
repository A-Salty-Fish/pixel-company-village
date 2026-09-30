import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  VILLAGE_FEEDBACK_ENABLED,
  feedbackCopy,
  feedbackPulsePixels,
  villageFeedback,
} from "@/features/village-feedback/village-feedback";

test("PV-PM-033 key actions share a receipt, a target, and a state", () => {
  assert.equal(VILLAGE_FEEDBACK_ENABLED, true);
  const wave = villageFeedback({ toast: "邻里应了一下。", targetId: "乙", state: "waved" });
  const lamp = villageFeedback({ toast: "门灯点上了。", targetId: "lamp", state: "on" });
  const found = villageFeedback({ toast: "找到了。", targetId: "甲", state: "found" });
  const beat = villageFeedback({ toast: "镜头到了。", targetId: "gate", state: "aimed" });
  assert.deepEqual(
    [wave, lamp, found, beat].map((item) => item && { toast: item.toast, state: item.state }),
    [
      { toast: "邻里应了一下。", state: "waved" },
      { toast: "门灯点上了。", state: "on" },
      { toast: "找到了。", state: "found" },
      { toast: "镜头到了。", state: "aimed" },
    ],
  );
  assert.equal(villageFeedback({ toast: "", targetId: "lamp", state: "on" }), null);
  assert.equal(villageFeedback({ toast: "门灯点上了。", targetId: "lamp", state: "on" }, false), null);
  assert.equal(feedbackPulsePixels(10, 20).length, 4);
  assert.equal(feedbackPulsePixels(10, 20, false).length, 0);
  assert.equal(copyIsClean(feedbackCopy()), true);
});
