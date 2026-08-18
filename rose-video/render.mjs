import { renderMedia } from "@remotion/renderer";
import { RoseVideo } from "./dist/RoseVideo.js";

const composition = {
  id: "RoseVideo",
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 1080,
  defaultProps: {},
};

await renderMedia({
  composition,
  component: RoseVideo,
  outputLocation: "./out/rose-bg.mp4",
  codec: "h264",
  crf: 20,
  overwrite: true,
});

console.log("✅ 渲染完成：out/rose-bg.mp4");
