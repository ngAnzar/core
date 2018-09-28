import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { InputModule } from "./input.module"
import { DirectivesModule } from "./directives.module"
import { FormFieldComponent } from "./components/form-field/form-field.component"


@NgModule({
    imports: [
        CommonModule,
        InputModule,
        DirectivesModule
    ],
    declarations: [
        FormFieldComponent
    ],
    exports: [
        FormFieldComponent,
        DirectivesModule
    ]
})
export class FormFieldModule {

}
