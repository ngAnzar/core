import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { ProgressBarComponent } from "./progress/bar.component"
import { ProgressCircleComponent } from "./progress/circle.component"
export { ProgressEvent, ProgressComponent } from "./progress/abstract"
export { ProgressBarComponent, ProgressCircleComponent }


import { RippleService } from "./ripple/ripple.service"
import { RippleDirective } from "./ripple/ripple.directive"
export { RippleRef } from "./ripple/ripple-ref"
export { BoundedRippleRef } from "./ripple/bounded-ripple-ref"
export { RippleOptions } from "./ripple/ripple-options"
export { RippleService, RippleDirective }


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ProgressBarComponent,
        ProgressCircleComponent,
        RippleDirective
    ],
    exports: [
        ProgressBarComponent,
        ProgressCircleComponent,
        RippleDirective
    ],
    providers: [
        RippleService
    ]
})
export class NzAnimationModule { }
