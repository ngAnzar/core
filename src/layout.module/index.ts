import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FlexLayoutModule, LAYOUT_CONFIG } from "@angular/flex-layout"


export { Rect, RectProps, getBoundingClientRect } from "./geometry/rect"
export { Point } from "./geometry/point"
export { Align, AlignInput, VAlign, HAlign, parseAlign, Margin, MarginParsed, parseMargin, composeMargin, OPPOSITE_ALIGN } from "./geometry/align"


import { RectMutationService } from "./rect-mutation.service"
export { RectMutationService }
export { Dimension, Position } from "./rect-mutation.service"


import { StackComponent } from "./stack/stack.component"
import { StackItemDirective, StackItemRef } from "./stack/stack-item.directive"
export { StackItemDirective, StackItemRef }


@NgModule({
    imports: [
        CommonModule,
        FlexLayoutModule
    ],
    declarations: [
        StackComponent,
        StackItemDirective,
    ],
    exports: [
        StackComponent,
        StackItemDirective,
        FlexLayoutModule
    ],
    providers: [
        RectMutationService,
        {
            provide: LAYOUT_CONFIG,
            useValue: {
                addFlexToParent: true,
                disableVendorPrefixes: true
            }
        }
    ]
})
export class NzLayoutModule { }
