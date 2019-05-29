import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"
// import { FlexLayoutModule } from "@angular/flex-layout"

import { NzCommonModule } from "../common.module"
import { NzDataModule } from "../data.module"
import { NzListModule } from "../list.module"
import { NzLayoutModule } from "../layout.module"


import { FormFieldComponent } from "./field/form-field.component"
export { FormFieldComponent }

import { PlaceholderComponent } from "./placeholder/placeholder.component"
export { PlaceholderComponent }

import { CheckboxComponent } from "./input/checkbox/checkbox.component"
import { CheckboxGroupDirective } from "./input/checkbox/checkbox-group.directive"
export { CheckboxComponent, CheckboxGroupDirective }

import { DateInputComponent } from "./input/date/date-input.component"
// import { DateInputComponent } from "./input/date/date-picker.component"
import { DatetimeInputComponent } from "./input/date/datetime-input.component"
import { TimeInputComponent } from "./input/date/time-input.component"
export { DateInputComponent, DatetimeInputComponent, TimeInputComponent }

import { RadioComponent } from "./input/radio/radio.component"
import { RadioGroupDirective } from "./input/radio/radio-group.directive"
export { RadioComponent, RadioGroupDirective }

import { RichtextInputComponent } from "./input/richtext/richtext-input.component"
import { RichtextService, RICHTEXT_COMPONENT, RichtextStaticFactory } from "./input/richtext/richtext.service"
import { RichtextDirective } from "./input/richtext/richtext.directive"
export { RichtextInputComponent, RichtextService, RICHTEXT_COMPONENT, RichtextStaticFactory, RichtextDirective }

import { SelectComponent } from "./input/select/select.component"
export { SelectComponent }
export { IAutocompleteModel, Match } from "./input/select/select.component"

import { TextFieldComponent, TextareaComponent } from "./input/text/input.component"

export { InputComponent, INPUT_VALUE_ACCESSOR } from "./input/abstract"


@NgModule({
    imports: [
        CommonModule,
        // FlexLayoutModule,
        ReactiveFormsModule,
        NzCommonModule,
        NzDataModule,
        NzListModule,
        NzLayoutModule
    ],
    declarations: [
        FormFieldComponent,
        PlaceholderComponent,

        CheckboxComponent,
        CheckboxGroupDirective,

        DateInputComponent,
        DatetimeInputComponent,
        TimeInputComponent,

        RadioComponent,
        RadioGroupDirective,

        RichtextInputComponent,
        RichtextDirective,

        SelectComponent,

        TextFieldComponent,
        TextareaComponent
    ],
    exports: [
        ReactiveFormsModule,

        FormFieldComponent,
        PlaceholderComponent,

        CheckboxComponent,
        CheckboxGroupDirective,

        DateInputComponent,
        DatetimeInputComponent,
        TimeInputComponent,

        RadioComponent,
        RadioGroupDirective,

        RichtextInputComponent,
        RichtextDirective,

        SelectComponent,

        TextFieldComponent,
        TextareaComponent
    ],
    providers: [
        RichtextService,
        { provide: RICHTEXT_COMPONENT, multi: true, useValue: { id: "hashtag", component: "TagComponent" } },
        { provide: RICHTEXT_COMPONENT, multi: true, useValue: { id: "client-link", component: "ClientLinkComponent" } },
        { provide: RICHTEXT_COMPONENT, multi: true, useValue: { id: "user-link", component: "UserLinkComponent" } },
    ]
})
export class NzFormModule { }
