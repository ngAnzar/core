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
        animate(`200ms ease-in`, style({
            "opacity": "1",
            "transform": "scale(1)"
        }))
    ],
    hide: [
        animate(`200ms ease-in`, style({ opacity: 0 }))
    ]
}

