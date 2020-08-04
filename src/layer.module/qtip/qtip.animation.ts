import { AnimationMetadata, style, animate } from "@angular/animations"

export type AnimationSet = { show: AnimationMetadata[], hide: AnimationMetadata[] }


export const qtipAnimation: AnimationSet = {
    show: [
        style({
            "transform": "scale(0.7)",
            "opacity": "0",
            "transform-origin": "{{ origin }}",
            "visibility": "visible"
        }),
        animate(`150ms cubic-bezier(0.5, 1, 0.89, 1)`, style({
            "opacity": "1",
            "transform": "scale(1)"
        }))
    ],
    hide: [
        animate(`150ms cubic-bezier(0.5, 1, 0.89, 1)`, style({ opacity: 0 }))
    ]
}

