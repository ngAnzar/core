import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { DateInputComponent } from "./components/date-input/date-input.component"
import { DatePickerComponent } from "./components/date-input/date-picker.component"
import { DateRangePickerComponent } from "./components/date-input/date-range-picker.component"
import { DateTimePickerComponent } from "./components/date-input/date-time-picker.component"

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        DateInputComponent,
        DatePickerComponent,
        DateRangePickerComponent,
        DateTimePickerComponent
    ],
    exports: [
        DateInputComponent,
        DatePickerComponent,
        DateRangePickerComponent,
        DateTimePickerComponent
    ]
})
export class DateInputModule {

}
