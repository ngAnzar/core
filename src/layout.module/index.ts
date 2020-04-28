import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FlexLayoutModule, LAYOUT_CONFIG } from "@angular/flex-layout"

import { NzCommonModule } from "../common.module"

import { RectMutationService } from "./rect-mutation.service"
export { RectMutationService }
export { Dimension, Position } from "./rect-mutation.service"


import { StackComponent } from "./stack/stack.component"
import { StackItemDirective, StackItemRef } from "./stack/stack-item.directive"
export { StackItemDirective, StackItemRef }


import { ExheaderComponent } from "./exheader/exheader.component"
import { Exheader_HeaderDirective, Exheader_ContentDirective } from "./exheader/exheader.directive"
export { ExheaderComponent, Exheader_HeaderDirective, Exheader_ContentDirective }



@NgModule({
    imports: [
        CommonModule,
        NzCommonModule,
        FlexLayoutModule.withConfig({
            disableVendorPrefixes: true
        })
    ],
    declarations: [
        StackComponent,
        StackItemDirective,
        ExheaderComponent,
        Exheader_HeaderDirective,
        Exheader_ContentDirective
    ],
    exports: [
        StackComponent,
        StackItemDirective,
        FlexLayoutModule,
        ExheaderComponent,
        Exheader_HeaderDirective,
        Exheader_ContentDirective
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
