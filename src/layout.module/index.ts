import { NgModule } from "@angular/core"


import { FlexibleDirective, VboxDirective, HboxDirective } from "./flex/flex.directive"


export { Rect } from "./geometry/rect"
export { Point } from "./geometry/point"
export { Align, AlignInput, VAlign, HAlign, parseAlign, Margin, MarginParsed, parseMargin } from "./geometry/align"


import { RectMutationService } from "./rect-mutation.service"
export { RectMutationService }
export { Dimension, Position } from "./rect-mutation.service"


@NgModule({
    declarations: [
        VboxDirective,
        HboxDirective,
        FlexibleDirective
    ],
    exports: [
        VboxDirective,
        HboxDirective,
        FlexibleDirective
    ],
    providers: [
        RectMutationService
    ]
})
export class NzLayoutModule { }
