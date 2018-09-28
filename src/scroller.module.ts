import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { ScrollerComponent } from "./components/scroller/scroller.component"
import { VirtualForDirective } from "./components/scroller/virtual-for.directive"


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ScrollerComponent,
        VirtualForDirective
    ],
    exports: [
        ScrollerComponent,
        VirtualForDirective
    ]
})
export class ScrollerModule {

}
