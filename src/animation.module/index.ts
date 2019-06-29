import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { ProgressBarComponent } from "./progress/bar.component"
import { ProgressCircleComponent } from "./progress/circle.component"
export { ProgressEvent, ProgressComponent } from "./progress/abstract"
export { ProgressBarComponent, ProgressCircleComponent }


import { RippleService } from "./ripple/ripple.service"
import { RippleComponent } from "./ripple/ripple.component"
export { RippleRef } from "./ripple/ripple-ref"
export { RippleOptions } from "./ripple/ripple-options"
export { RippleService, RippleComponent }


import { Renderer } from "./renderer.service"


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ProgressBarComponent,
        ProgressCircleComponent,
        RippleComponent
    ],
    exports: [
        ProgressBarComponent,
        ProgressCircleComponent,
        RippleComponent
    ],
    providers: [
        Renderer,
        RippleService
    ]
})
export class NzAnimationModule { }
