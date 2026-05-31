import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Composition } from "remotion";
import { RoseVideo } from "./RoseVideo";
export const RemotionRoot = () => {
    return (_jsx(_Fragment, { children: _jsx(Composition, { id: "RoseVideo", component: RoseVideo, durationInFrames: 1080, fps: 30, width: 1920, height: 1080, defaultProps: { audioSrc: undefined } }) }));
};
