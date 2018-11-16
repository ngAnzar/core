import { NgModule } from "@angular/core"


export { Rect, Margin } from "./geometry/rect"
export { Point } from "./geometry/point"
export { Align, AlignInput, VAlign, HAlign, parseAlign } from "./geometry/align"


import { RectMutationService } from "./rect-mutation.service"
export { RectMutationService }


@NgModule({
    providers: [
        RectMutationService
    ]
})
export class NzLayoutModule { }
