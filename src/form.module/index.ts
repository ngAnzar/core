import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { NzCommonModule } from "../common.module"
import { NzDataModule } from "../data.module"
import { NzListModule } from "../list.module"
import { NzLayoutModule } from "../layout.module"


import { FormFieldComponent } from "./field/form-field.component"
export { FormFieldComponent }

import { CheckboxComponent } from "./input/checkbox/checkbox.component"
import { CheckboxColumnComponent } from "./input/checkbox/checkbox-column.component"
import { CheckboxGroupDirective } from "./input/checkbox/checkbox-group.directive"
export { CheckboxComponent, CheckboxGroupDirective }

import { DateInputComponent } from "./input/date/date-input.component"
// import { DateInputComponent } from "./input/date/date-picker.component"
import { DatetimeInputComponent } from "./input/date/datetime-input.component"
export { DateInputComponent, DatetimeInputComponent }

import { RadioComponent } from "./input/radio/radio.component"
import { RadioGroupDirective } from "./input/radio/radio-group.directive"
export { RadioComponent, RadioGroupDirective }

import { SelectComponent } from "./input/select/select.component"
import { ChipComponent } from "./input/select/chip.component"
export { SelectComponent }
export { IAutocompleteModel, Match } from "./input/select/select.component"

import { TextFieldComponent, TextareaComponent } from "./input/text/input.component"

export { InputComponent, INPUT_VALUE_ACCESSOR } from "./input/abstract"


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzCommonModule,
        NzDataModule,
        NzListModule,
        NzLayoutModule
    ],
    declarations: [
        FormFieldComponent,

        CheckboxComponent,
        CheckboxColumnComponent,
        CheckboxGroupDirective,

        DateInputComponent,
        DatetimeInputComponent,

        RadioComponent,
        RadioGroupDirective,

        SelectComponent,
        ChipComponent,

        TextFieldComponent,
        TextareaComponent
    ],
    exports: [
        ReactiveFormsModule,

        FormFieldComponent,

        CheckboxComponent,
        CheckboxColumnComponent,
        CheckboxGroupDirective,

        DateInputComponent,
        DatetimeInputComponent,

        RadioComponent,
        RadioGroupDirective,

        SelectComponent,

        TextFieldComponent,
        TextareaComponent
    ]
})
export class NzFormModule { }
