import { Observable, Subject } from "rxjs"
import { shareReplay } from "rxjs/operators"

import { Destructible } from "../../../util"

import { DayData } from "./date-picker.component"


export interface SelectedMonthData {
    begin: Date
    end: Date
}


export type ExternalDayData = { [key: number]: DayData }


export abstract class DatePickerDayDataProvider extends Destructible {
    public abstract extraData(begin: Date, end: Date): Observable<ExternalDayData>
}
