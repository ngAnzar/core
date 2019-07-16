import { AnimationTriggerMetadata, trigger, state, style, animate, transition, query } from "@angular/animations"


export const enum VPAnimState {
    MENU_OPEN_SLIDE = "mopen-slide",
    MENU_CLOSE_SLIDE = "mclose-slide",
    MENU_OPEN_OVERLAY = "mopen-overlay",
    MENU_CLOSE_OVERLAY = "mclose-overlay",

    RIGHT_OPEN_SLIDE = "ropen-slide",
    RIGHT_CLOSE_SLIDE = "rclose-slide",
    RIGHT_OPEN_OVERLAY = "ropen-overlay",
    RIGHT_CLOSE_OVERLAY = "rclose-overlay",
}


// mopen-slide--ropen-slide


export const ANIM_DURATION = "400ms cubic-bezier(0.215, 0.61, 0.355, 1)"
// export const ANIM_DURATION = "550ms cubic-bezier(0.68, -0.55, 0.265, 1.55)"

export const VPSidenavAnimation: AnimationTriggerMetadata = trigger("animateSidenav", [
    state(`void, ${VPAnimState.MENU_CLOSE_SLIDE}, ${VPAnimState.MENU_CLOSE_OVERLAY}`, style({
        "transform": "translateX(-{{sidenavWidth}}px)"
    }), { params: { sidenavWidth: 100000 } }),

    state(`${VPAnimState.MENU_OPEN_SLIDE}, ${VPAnimState.MENU_OPEN_OVERLAY}`, style({
        "transform": `translateX(0)`
    })),

    // open
    transition(`${VPAnimState.MENU_CLOSE_SLIDE} => ${VPAnimState.MENU_OPEN_SLIDE}`, [
        animate(ANIM_DURATION, style({ "transform": "translateX(0)" }))
    ]),

    transition(`${VPAnimState.MENU_CLOSE_OVERLAY} => ${VPAnimState.MENU_OPEN_OVERLAY}`, [
        animate(ANIM_DURATION, style({ "transform": "translateX(0)" }))
    ]),

    // close
    transition(`${VPAnimState.MENU_OPEN_SLIDE} => ${VPAnimState.MENU_CLOSE_SLIDE}`, [
        animate(ANIM_DURATION, style({ "transform": "translateX(-{{sidenavWidth}}px)" }))
    ]),

    transition(`${VPAnimState.MENU_OPEN_OVERLAY} => ${VPAnimState.MENU_CLOSE_OVERLAY}`, [
        animate(ANIM_DURATION, style({ "transform": "translateX(-{{sidenavWidth}}px)" }))
    ]),
])


export const VPContentAnimation: AnimationTriggerMetadata = trigger("animateContent", [
    state(`void, ${VPAnimState.MENU_CLOSE_SLIDE}, ${VPAnimState.MENU_CLOSE_OVERLAY}`, style({
        "padding-right": "0"
    })),

    state(`${VPAnimState.MENU_OPEN_SLIDE}`, style({
        "padding-right": "{{sidenavWidth}}px",
        "transform": "translateX({{sidenavWidth}}px)"
    }), { params: { sidenavWidth: 0 } }),

    state(`${VPAnimState.MENU_OPEN_OVERLAY}`, style({
        "transform": "translateX({{sidenavWidth}}px)"
    }), { params: { sidenavWidth: 0 } }),


    // open
    transition(`${VPAnimState.MENU_CLOSE_SLIDE} => ${VPAnimState.MENU_OPEN_SLIDE}`, [
        animate(ANIM_DURATION, style({
            "transform": "translateX({{sidenavWidth}}px)"
        }))
    ]),

    transition(`${VPAnimState.MENU_CLOSE_OVERLAY} => ${VPAnimState.MENU_OPEN_OVERLAY}`, [
        animate(ANIM_DURATION, style({
            "transform": "translateX({{sidenavWidth}}px)"
        }))
    ]),


    // close
    transition(`${VPAnimState.MENU_OPEN_SLIDE} => ${VPAnimState.MENU_CLOSE_SLIDE}`, [
        animate(ANIM_DURATION, style({
            "transform": "translateX(0)"
        }))
    ]),

    transition(`${VPAnimState.MENU_OPEN_OVERLAY} => ${VPAnimState.MENU_CLOSE_OVERLAY}`, [
        animate(ANIM_DURATION, style({
            "transform": "translateX(0)"
        }))
    ])
])


export const VPOverlayAnimation: AnimationTriggerMetadata = trigger("animateOverlay", [
    state(`void, ${VPAnimState.MENU_OPEN_SLIDE}, ${VPAnimState.MENU_CLOSE_SLIDE}, ${VPAnimState.MENU_CLOSE_OVERLAY}`, style({
        "display": "none",
        "opacity": 0
    })),

    state(`${VPAnimState.MENU_OPEN_OVERLAY}`, style({
        "display": "block",
        "opacity": 0.6
    })),

    transition(`* => ${VPAnimState.MENU_OPEN_OVERLAY}`, [
        animate(ANIM_DURATION, style({
            "opacity": 0.6
        }))
    ]),

    transition(`${VPAnimState.MENU_OPEN_OVERLAY} => ${VPAnimState.MENU_CLOSE_OVERLAY}`, [
        animate(ANIM_DURATION, style({
            "opacity": 0
        }))
    ])
])
