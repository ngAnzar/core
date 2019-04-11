import { AnimationTriggerMetadata, trigger, state, style, animate, transition, query } from "@angular/animations"


export const ANIM_DURATION = "550ms cubic-bezier(0.215, 0.61, 0.355, 1)"


export const ExlistItemAnimation: AnimationTriggerMetadata = trigger("animation", [
    state(`void, closed`, style({
        "height": "{{ height }}px",
        "margin": "0"
    }), { params: { height: 48 } }),

    state(`opened`, style({
        "height": "auto",
        "margin": "{{ marginTop }}px {{ marginRight }}px {{ marginBottom }}px {{ marginLeft }}px"
    }), {
            params: {
                marginTop: 48,
                marginRight: -24,
                marginBottom: 48,
                marginLeft: -24,
            }
        }
    ),

    // open
    transition(`* => opened`, [
        animate(ANIM_DURATION, style({
            "height": "auto",
            "margin": "{{ marginTop }}px {{ marginRight }}px {{ marginBottom }}px {{ marginLeft }}px"
        }))
    ])
])
