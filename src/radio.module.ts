import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { RadioComponent } from "./components/radio/radio.component"
import { RadioGroupDirective } from "./components/radio/radio-group.directive"


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    declarations: [
        RadioComponent,
        RadioGroupDirective
    ],
    exports: [
        RadioComponent,
        RadioGroupDirective,
        ReactiveFormsModule
    ]
})
export class RadioModule {

}
