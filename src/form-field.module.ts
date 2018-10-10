import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { InputModule } from "./input.module"
import { DirectivesModule } from "./directives.module"
import { FormFieldComponent } from "./components/form-field/form-field.component"


@NgModule({
    imports: [
        CommonModule,
        InputModule,
        DirectivesModule,
        ReactiveFormsModule
    ],
    declarations: [
        FormFieldComponent
    ],
    exports: [
        FormFieldComponent,
        DirectivesModule,
        ReactiveFormsModule
    ]
})
export class FormFieldModule {

}
