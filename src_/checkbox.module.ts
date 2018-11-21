import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { CheckboxComponent, TristateCheckboxComponent } from "./components/checkbox/checkbox.component"
import { CheckboxGroupDirective } from "./components/checkbox/checkbox-group.directive"


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    declarations: [
        CheckboxComponent,
        TristateCheckboxComponent,
        CheckboxGroupDirective
    ],
    exports: [
        CheckboxComponent,
        TristateCheckboxComponent,
        CheckboxGroupDirective,
        ReactiveFormsModule
    ]
})
export class CheckboxModule {

}
