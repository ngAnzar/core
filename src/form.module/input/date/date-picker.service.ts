import { StaticProvider, Injector, Injectable } from "@angular/core"

import { LevitateOptions, ComponentLayerRef } from "../../../layer.module"
import { DatePickerComponent } from "./date-picker.component"
import { AbstractPickerService } from "./abstract"


export interface DatePickerOptions {
    type: "date" | "datetime"
    count?: number
    position: LevitateOptions
    initial?: Date,
    value?: Date,
    min?: Date,
    max?: Date
}


@Injectable()
export class DatePickerService extends AbstractPickerService<DatePickerComponent, Date> {
    protected _create(position: LevitateOptions, provides?: StaticProvider[], injector?: Injector): ComponentLayerRef<DatePickerComponent> {
        return this.layerSvc.createFromComponent(DatePickerComponent, this._createBehavior(position), null, provides, null, injector)
    }
}
