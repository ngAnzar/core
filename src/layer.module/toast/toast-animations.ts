import { AnimationMetadata, state, style, animate, transition, query, group, animation, keyframes } from "@angular/animations"

import { AnimationSet, transitionDuration } from "../layer/layer-animations"


export const tada: AnimationSet = {
    show: [
        style({
            "transform": "scale(0.5)",
            "opacity": 0,
            "visibility": "visible"
        }),

        animate(`250ms ease-in`, style({
            "transform": "skewX(2deg) skewY(1deg) scale(0.9)",
            "opacity": 1,
        })),
        animate("900ms ease-out", keyframes([
            style({ transform: "skewX(3deg) skewY(1deg) scale(0.9)" }),
            style({ transform: "skewX(-3deg) skewY(-1deg) scale(1.1)" }),

            style({ transform: "skewX(2deg) skewY(0.5deg) scale(1)" }),
            style({ transform: "skewX(-2deg) skewY(-0.5deg) scale(1.05)" }),

            style({ transform: "skewX(1deg) skewY(0.5deg) scale(1)" }),

            style({ transform: "skewX(0) skewY(0) scale(1)" }),
        ]))
    ],
    hide: [
        animate(`250ms ease-in`, style({
            "transform": "scale(0.5)",
            "opacity": 0,

        }))
    ]
}
