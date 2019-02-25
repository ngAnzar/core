import { Provider } from "@angular/core"
import { HAMMER_GESTURE_CONFIG, HammerGestureConfig } from "@angular/platform-browser/"


import "hammerjs"

export class HammerConfig extends HammerGestureConfig {
    overrides = {
        pan: {
            threshold: 10,
            direction: Hammer.DIRECTION_ALL
        },
        pinch: {
            enable: false
        },
        rotate: {
            enable: false
        }
    }
}


export const HAMMER_CONFIG: Provider = {
    provide: HAMMER_GESTURE_CONFIG,
    useClass: HammerConfig
}
