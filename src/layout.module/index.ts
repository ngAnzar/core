import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FlexLayoutModule, LAYOUT_CONFIG } from "@angular/flex-layout"

import { NzCommonModule } from "../common.module"

import { RectMutationService } from "./rect-mutation.service"
export { RectMutationService }
export { Dimension, Position } from "./rect-mutation.service"


import { StackComponent } from "./stack/stack.component"
import { StackItemDirective, StackItemRef } from "./stack/stack-item.directive"
import { StackChildDirective } from "./stack/stack-child.directive"
export { StackItemDirective, StackItemRef }


import { ExheaderComponent } from "./exheader/exheader.component"
import { Exheader_HeaderDirective, Exheader_ContentDirective } from "./exheader/exheader.directive"
export { ExheaderComponent, Exheader_HeaderDirective, Exheader_ContentDirective }

import { HideDirective } from "./hide.directive"
import { FlexLayoutDirective, FlexParentLayoutDirective } from "./flex/flex-layout.directive"
import { FlexChildDirective } from "./flex/flex-child.directive"

import { SyncHeightFromDirective, SyncHeightToDirective } from "./sync-height.directive"
export { SyncHeightFromDirective, SyncHeightToDirective }


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
        StackChildDirective,

        ExheaderComponent,
        Exheader_HeaderDirective,
        Exheader_ContentDirective,

        HideDirective,
        FlexLayoutDirective,
        FlexParentLayoutDirective,
        FlexChildDirective,

        SyncHeightFromDirective,
        SyncHeightToDirective
    ],
    exports: [
        StackComponent,
        StackItemDirective,
        FlexLayoutModule,
        ExheaderComponent,
        Exheader_HeaderDirective,
        Exheader_ContentDirective,

        HideDirective,
        FlexLayoutDirective,
        FlexParentLayoutDirective,
        FlexChildDirective,

        SyncHeightFromDirective,
        SyncHeightToDirective
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
