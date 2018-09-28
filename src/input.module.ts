import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { TextFieldComponent } from "./components/input/input.component"
export { InputComponent } from "./components/input/input.component"


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    declarations: [
        TextFieldComponent
    ],
    exports: [
        TextFieldComponent
    ]
})
export class InputModule {

}
