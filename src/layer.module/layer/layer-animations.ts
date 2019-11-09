import { AnimationMetadata, state, style, animate, transition, query, group } from "@angular/animations"

export type AnimationSet = { show: AnimationMetadata[], hide: AnimationMetadata[] }

// https://tympanus.net/Development/ModalWindowEffects/

export const transitionDuration = 300


export const fallAnimation: AnimationSet = {
    show: [
        style({
            // "perspective:": "1300px",
            "transform": "scale(1.5)",
            "visibility": "visible",
            "opacity": "0"
        }),
        animate(`${transitionDuration}ms ease-in`, style({
            "transform": "scale(1)",
            "opacity": "1"
        }))
    ],
    hide: [
        animate(`${transitionDuration}ms ease-in`, style({
            "transform": "scale(1.5)",
            "visibility": "visible",
            "opacity": "0"
        }))
    ]
}


export const fadeAnimation: AnimationSet = {
    show: [
        style({ opacity: 0 }),
        animate(`${transitionDuration}ms ease-in`, style({ opacity: 1 }))
    ],
    hide: [
        animate(`${transitionDuration}ms ease-in`, style({ opacity: 0 }))
    ]
}


// export const ddAnimation: AnimationSet = {
//     show: [
//         query(":self, .nz-layer-content", style({
//             "visibility": "visible",
//             "width": "{{ initialWidth }}",
//             "height": "{{ initialHeight }}",
//         })),
//         // style({
//         //     "visibility": "visible",
//         //     "opacity": "0",
//         //     "width": "{{ initialWidth }}",
//         //     "height": "{{ initialHeight }}",
//         // }),

//         // animate(`500ms ease-in`, style({
//         //     "opacity": 1
//         // })),

//         query(":self, .nz-layer-content", animate(`200ms ease-in`, style({
//             // "opacity": 1,
//             "width": "{{ finalWidth }}",
//             "height": "{{ finalHeight }}"
//         })))
//     ],
//     hide: fadeAnimation.hide
// }


export const ddAnimation: AnimationSet = {
    show: [
        style({
            "transform": "scale({{ scaleXStart }}, {{ scaleYStart }}) translate({{ translateX }}, {{ translateY }})",
            "opacity": "0",
            "transform-origin": "{{ origin }}",
            "visibility": "visible"
        }),
        animate(`150ms ease-in`, style({
            "opacity": "1",
            "transform": "scale(1, 1) translate(0px, 0px)"
        }))
    ],
    hide: [
        animate(`150ms ease-in`, style({ opacity: 0 }))
    ]
}

