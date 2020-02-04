import { AnimationTriggerMetadata, trigger, state, style, animate, transition, query } from "@angular/animations"


// states: left-out, left-in, right-out, right-in


export const ANIM_DURATION = "400ms cubic-bezier(0.215, 0.61, 0.355, 1)"
// export const ANIM_DURATION = "550ms cubic-bezier(0.68, -0.55, 0.265, 1.55)"

export const AnimateSwitch: AnimationTriggerMetadata = trigger("childSwitch", [
    state(`void`, style({ visibility: "hidden" })),
    state(`left-out`, style({ visibility: "hidden", transform: "translate3d(-100%, 0, 0)" })),
    state(`right-out`, style({ visibility: "hidden", transform: "translate3d(100%, 0, 0)" })),
    state(`left-in, right-in`, style({ visibility: "visible", transform: "translate3d(0, 0, 0)" })),
    state(`visible`, style({ visibility: "visible", transform: "translate3d(0, 0, 0)" })),

    transition(`* => left-out`, [
        style({ visibility: "visible" }),
        animate(ANIM_DURATION, style({ transform: "translate3d(-100%, 0, 0)" }))
    ]),

    transition(`* => left-in`, [
        style({ transform: "translate3d(100%, 0, 0)", visibility: "visible" }),
        animate(ANIM_DURATION, style({ transform: "translate3d(0, 0, 0)" }))
    ]),

    transition(`* => right-out`, [
        style({ visibility: "visible" }),
        animate(ANIM_DURATION, style({ transform: "translate3d(100%, 0, 0)" }))
    ]),

    transition(`* => right-in`, [
        style({ transform: "translate3d(-100%, 0, 0)", visibility: "visible" }),
        animate(ANIM_DURATION, style({ transform: "translate3d(0, 0, 0)" }))
    ])
])
