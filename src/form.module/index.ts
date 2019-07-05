import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { IMaskModule } from "angular-imask"

import { NzCommonModule } from "../common.module"
import { NzDataModule } from "../data.module"
import { NzListModule } from "../list.module"
import { NzLayoutModule } from "../layout.module"
import { NzLayerModule } from "../layer.module"


import { FormFieldComponent } from "./field/form-field.component"
export { FormFieldComponent }

import { PlaceholderComponent } from "./placeholder/placeholder.component"
export { PlaceholderComponent }

import { CheckboxComponent, TristateCheckboxComponent, TristateCheckboxValue, CheckboxChangeEvent } from "./input/checkbox/checkbox.component"
import { CheckboxGroupDirective } from "./input/checkbox/checkbox-group.directive"
export { CheckboxComponent, TristateCheckboxComponent, TristateCheckboxValue, CheckboxGroupDirective, CheckboxChangeEvent }

import { DateInputComponent } from "./input/date/date-input.component"
import { DatePickerComponent } from "./input/date/date-picker.component"
import { DatePickerService } from "./input/date/date-picker.service"
// import { DatetimeInputComponent } from "./input/date/datetime-input.component"
// import { TimeInputComponent } from "./input/date/time-input.component"
export {
    DateInputComponent, DatePickerComponent, DatePickerService
}

import { RadioComponent } from "./input/radio/radio.component"
import { RadioGroupDirective } from "./input/radio/radio-group.directive"
export { RadioComponent, RadioGroupDirective }

import { RichtextInputComponent } from "./input/richtext/richtext-input.component"
import {
    RichtextService,
    RICHTEXT_COMPONENT, RICHTEXT_COMPONENT_PARAMS, RichtextStaticFactory,
    RICHTEXT_AUTO_COMPLETE
} from "./input/richtext/richtext.service"
import { RichtextAcProvider, RichtextAcItem, RichtextAcComponent } from "./input/richtext/richtext-ac.component"
import { RichtextDirective, RichtextEditableDirective } from "./input/richtext/richtext.directive"
import { RichtextMenu } from "./input/richtext/richtext-menu.component"
export { RichtextStream } from "./input/richtext/richtext-stream"
export {
    RichtextInputComponent, RichtextService, RichtextDirective,
    RICHTEXT_COMPONENT, RICHTEXT_COMPONENT_PARAMS, RichtextStaticFactory,
    RICHTEXT_AUTO_COMPLETE, RichtextAcProvider, RichtextAcItem
}

import { SelectComponent } from "./input/select/select.component"
export { SelectComponent }
export { IAutocompleteModel, Match } from "./input/select/select.component"

import { TextFieldComponent, TextareaComponent } from "./input/text/input.component"

export { InputComponent, INPUT_MODEL, InputModel, FocusChangeEvent } from "./input/abstract"


@NgModule({
    imports: [
        CommonModule,
        IMaskModule,
        ReactiveFormsModule,
        NzCommonModule,
        NzDataModule,
        NzListModule,
        NzLayoutModule,
        NzLayerModule
    ],
    declarations: [
        FormFieldComponent,
        PlaceholderComponent,

        CheckboxComponent,
        TristateCheckboxComponent,
        CheckboxGroupDirective,

        DateInputComponent,
        DatePickerComponent,

        RadioComponent,
        RadioGroupDirective,

        RichtextInputComponent,
        RichtextDirective,
        RichtextEditableDirective,
        RichtextMenu,
        RichtextAcComponent,

        SelectComponent,

        TextFieldComponent,
        TextareaComponent
    ],
    exports: [
        ReactiveFormsModule,

        FormFieldComponent,
        PlaceholderComponent,

        CheckboxComponent,
        TristateCheckboxComponent,
        CheckboxGroupDirective,

        DateInputComponent,
        DatePickerComponent,

        RadioComponent,
        RadioGroupDirective,

        RichtextInputComponent,
        RichtextDirective,
        RichtextEditableDirective,
        RichtextMenu,
        RichtextAcComponent,

        SelectComponent,

        TextFieldComponent,
        TextareaComponent
    ],
    providers: [
        DatePickerService
    ],
    entryComponents: [
        RichtextMenu,
        RichtextAcComponent,
        DatePickerComponent
    ]
})
export class NzFormModule { }
