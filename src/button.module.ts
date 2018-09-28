import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { ButtonComponent } from "./components/button/button.component"
import { RippleDirective } from "./ripple/ripple.directive"


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ButtonComponent,
        RippleDirective
    ],
    exports: [
        ButtonComponent,
        RippleDirective
    ]
})
export class ButtonModule {

}
