import { AnimationMetadata, trigger, state, style, animate, transition, query } from "@angular/animations"


export const ANIM_DURATION = "550ms cubic-bezier(0.215, 0.61, 0.355, 1)"


// export const ExlistItemAnimation: AnimationTriggerMetadata = trigger("animation", [
//     state(`void, closed`, style({
//         "height": "{{ height }}px",
//         "margin": "0"
//     }), { params: { height: 48 } }),

//     state(`opened`, style({
//         "height": "auto",
//         "margin": "{{ marginTop }}px {{ marginRight }}px {{ marginBottom }}px {{ marginLeft }}px"
//     }), {
//             params: {
//                 // marginTop: 48,
//                 marginRight: -24,
//                 marginBottom: 48,
//                 marginLeft: -24,
//             }
//         }
//     ),

//     // open
//     transition(`* => opened`, [
//         animate(ANIM_DURATION, style({
//             "height": "auto",
//             "margin": "{{ marginTop }}px {{ marginRight }}px {{ marginBottom }}px {{ marginLeft }}px"
//         }))
//     ])
// ])


export type AnimationSet = { show: AnimationMetadata[], hide: AnimationMetadata[] }

export const exlistItemAnimation: AnimationSet = {
    show: [
        style({
            "height": "{{ height }}px",
            "margin-top": "0",
            "margin-right": "0",
            "margin-bottom": "0",
            "margin-left": "0",
        }),
        animate(ANIM_DURATION, style({
            // "margin": "{{ marginTop }}px {{ marginRight }}px {{ marginBottom }}px {{ marginLeft }}px"
            "height": "auto",
            "margin-top": "{{ marginTop }}px",
            "margin-right": "{{ marginRight }}px",
            "margin-bottom": "{{ marginBottom }}px",
            "margin-left": "{{ marginLeft }}px",
        }))
    ],
    hide: [
        animate(ANIM_DURATION, style({
            "height": "{{ height }}px",
            "margin-top": "0",
            "margin-right": "0",
            "margin-bottom": "0",
            "margin-left": "0",
        }))
    ]
}
