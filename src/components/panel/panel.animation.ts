import { AnimationTriggerMetadata, trigger, state, style, animate, transition } from "@angular/animations"

export const transitionDuration: number = 400


export const transitionAnimation: AnimationTriggerMetadata = trigger("animation", [

    state("opened", style({
        "transform": "none",
        "visibility": "visible"
    })),

    state("void, closed", style({
        "box-shadow": "none",
        "visibility": "hidden"
    })),

    // instant open
    transition("void => opened", animate(0)),

    // transition("closed => opened", [
    //     style({ visibility: "visible" }),
    //     animate(0)
    // ]),

    // normal open / close
    transition("opened <=> closed", animate(`${transitionDuration}ms cubic-bezier(0.25, 0.8, 0.25, 1)`))
])
