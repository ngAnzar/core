import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { TextFieldComponent, TextareaComponent } from "./components/input/input.component"
export { InputComponent, INPUT_VALUE_ACCESSOR } from "./components/input/input.component"


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    declarations: [
        TextFieldComponent,
        TextareaComponent
    ],
    exports: [
        TextFieldComponent,
        TextareaComponent
    ]
})
export class InputModule {

}
