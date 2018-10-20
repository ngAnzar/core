import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { ScrollerDirective } from "./components/scroller/scroller.directive"
import { VirtualForDirective } from "./components/scroller/virtual-for.directive"


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ScrollerDirective,
        VirtualForDirective
    ],
    exports: [
        ScrollerDirective,
        VirtualForDirective
    ]
})
export class ScrollerModule {

}
