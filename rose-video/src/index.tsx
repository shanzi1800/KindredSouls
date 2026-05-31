import { Composition } from "remotion";
import { RoseVideo } from "./RoseVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RoseVideo"
        component={RoseVideo}
        durationInFrames={1080}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ audioSrc: undefined }}
      />
    </>
  );
};
