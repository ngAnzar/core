import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { DateInputComponent } from "./components/date-input/date-input.component"
import { TimeInputComponent } from "./components/date-input/time-input.component"
import { DatePickerComponent } from "./components/date-input/date-picker.component"
import { DateRangePickerComponent } from "./components/date-input/date-range-picker.component"
import { DateTimePickerComponent } from "./components/date-input/date-time-picker.component"
import { DatetimeInputComponent } from "./components/date-input/datetime-input.component"

export {
    DateInputComponent,
    TimeInputComponent,
    DatePickerComponent,
    DateRangePickerComponent,
    DateTimePickerComponent,
    DatetimeInputComponent
}


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    declarations: [
        DateInputComponent,
        TimeInputComponent,
        DatePickerComponent,
        DateRangePickerComponent,
        DateTimePickerComponent,
        DatetimeInputComponent
    ],
    exports: [
        DateInputComponent,
        TimeInputComponent,
        DatePickerComponent,
        DateRangePickerComponent,
        DateTimePickerComponent,
        DatetimeInputComponent
    ]
})
export class DateInputModule {

}
