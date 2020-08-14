import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { NzCommonModule } from "../common.module"
import { NzDataModule } from "../data.module"
import { NzListModule } from "../list.module"
import { NzLayoutModule } from "../layout.module"
import { NzLayerModule } from "../layer.module"
import { NzAnimationModule } from "../animation.module"


import { ErrorComponent, DEFAULT_ERROR_MESSAGES } from "./error/error.component"
import { ErrorMessageDirective } from "./error/error-message.directive"
export { ErrorComponent, ErrorMessageDirective, DEFAULT_ERROR_MESSAGES }

import { FormFieldComponent } from "./field/form-field.component"
export { FormFieldComponent }

import { PlaceholderComponent } from "./placeholder/placeholder.component"
export { PlaceholderComponent }

import { CheckboxComponent, CheckboxChangeEvent, CheckboxState } from "./input/checkbox/checkbox.component"
import { CheckboxGroupDirective } from "./input/checkbox/checkbox-group.directive"
export { CheckboxComponent, CheckboxGroupDirective, CheckboxChangeEvent, CheckboxState }

import { DateInputComponent, DateMinMaxValidator } from "./input/date/date-input.component"
import { DatePickerComponent } from "./input/date/date-picker.component"
import { DatePickerService } from "./input/date/date-picker.service"
import { DatetimeInputComponent } from "./input/date/datetime-input.component"
import { DatetimePickerComponent } from "./input/date/datetime-picker.component"
import { DatetimePickerService } from "./input/date/datetime-picker.service"
import { TimeInputComponent, TimeValidator } from "./input/date/time-input.component"
import { TimePickerService } from "./input/date/time-picker.service"
import { NumberScrollComponent, YearGenerator, MonthGenerator, DayGenerator, HourGenerator, MinuteGenerator } from "./input/date/number-scroll.component"
import { TimePickerComponent } from "./input/date/time-picker.component"
import { DatePickerDayDataProvider, ExternalDayData, DayData } from "./input/date/abstract"
export {
    DateInputComponent, DatePickerComponent, DatePickerService, TimeInputComponent, TimeValidator, TimePickerService,
    NumberScrollComponent, YearGenerator, MonthGenerator, DayGenerator, HourGenerator, MinuteGenerator,
    DatetimePickerService, DatePickerDayDataProvider, DayData, ExternalDayData
}

import { RadioComponent } from "./input/radio/radio.component"
import { RadioGroupDirective } from "./input/radio/radio-group.directive"
export { RadioComponent, RadioGroupDirective }
import { FileInputComponent, UploadedFile } from "./input/file/file.component"
export { FileInputComponent, UploadedFile }


import { RICHTEXT_AUTO_COMPLETE, RichtextAcItem, RichtextAcProvider, RichtextAcSession } from "./input/richtext/core/autocomplete"
import { RICHTEXT_COMPONENT } from "./input/richtext/core/component-manager"
import { RichtextComponent, RichtextComponentParams, RichtextComponentRef } from "./input/richtext/core/component-ref"
import { RichtextInputComponent } from "./input/richtext/richtext-input.component"
import { RichtextDirective, RichtextEditableDirective, RICHTEXT_EDITABLE } from "./input/richtext/richtext.directive"
import { RichtextMenuComponent, RichtextMenuDirective } from "./input/richtext/richtext-menu.component"
import { AutocompleteComponent } from "./input/richtext/autocomplete.component"
export { RichtextStream } from "./input/richtext/core/richtext-stream"
export {
    RichtextInputComponent, RichtextDirective,
    RICHTEXT_AUTO_COMPLETE, RichtextAcItem, RichtextAcProvider, RichtextAcSession,
    RICHTEXT_COMPONENT, RichtextComponent, RichtextComponentParams, RichtextComponentRef,
    RICHTEXT_EDITABLE
}

import { SelectComponent } from "./input/select/select.component"
export { SelectComponent }
export { IAutocompleteModel, Match } from "./input/select/select.component"

import { TextFieldComponent, NumberFieldComponent, TextareaComponent } from "./input/text/input.component"
import { InputMaskDirective } from "./input/input-mask.directive"

export { InputComponent, INPUT_MODEL, INPUT_MODEL_VALUE_CMP, InputModel, InputGroupModel, FocusChangeEvent, inputValueComparator } from "./input/abstract"


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzCommonModule,
        NzDataModule,
        NzListModule,
        NzLayoutModule,
        NzLayerModule,
        NzAnimationModule
    ],
    declarations: [
        ErrorComponent,
        ErrorMessageDirective,

        FormFieldComponent,
        PlaceholderComponent,

        CheckboxComponent,
        CheckboxGroupDirective,

        DateInputComponent,
        DateMinMaxValidator,
        DatePickerComponent,

        DatetimeInputComponent,
        DatetimePickerComponent,

        TimeInputComponent,
        TimeValidator,
        TimePickerComponent,

        NumberScrollComponent,
        YearGenerator,
        MonthGenerator,
        DayGenerator,
        HourGenerator,
        MinuteGenerator,

        RadioComponent,
        RadioGroupDirective,

        FileInputComponent,

        RichtextInputComponent,
        RichtextDirective,
        RichtextEditableDirective,
        RichtextMenuComponent,
        RichtextMenuDirective,
        AutocompleteComponent,

        SelectComponent,

        TextFieldComponent,
        NumberFieldComponent,
        TextareaComponent,
        InputMaskDirective
    ],
    exports: [
        ErrorComponent,
        ErrorMessageDirective,

        ReactiveFormsModule,

        FormFieldComponent,
        PlaceholderComponent,

        CheckboxComponent,
        CheckboxGroupDirective,

        DateInputComponent,
        DateMinMaxValidator,
        DatePickerComponent,

        DatetimeInputComponent,
        DatetimePickerComponent,

        TimeInputComponent,
        TimeValidator,
        TimePickerComponent,

        NumberScrollComponent,
        YearGenerator,
        MonthGenerator,
        DayGenerator,
        HourGenerator,
        MinuteGenerator,

        RadioComponent,
        RadioGroupDirective,

        FileInputComponent,

        RichtextInputComponent,
        RichtextDirective,
        RichtextEditableDirective,
        RichtextMenuComponent,
        RichtextMenuDirective,
        AutocompleteComponent,

        SelectComponent,

        TextFieldComponent,
        NumberFieldComponent,
        TextareaComponent,
        InputMaskDirective
    ],
    providers: [
        DatePickerService,
        TimePickerService,
        DatetimePickerService
    ],
    entryComponents: [
        RichtextMenuComponent,
        AutocompleteComponent,
        DatePickerComponent,
        TimePickerComponent,
        DatetimePickerComponent,
    ]
})
export class NzFormModule { }
