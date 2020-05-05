import { StaticProvider, Injector, Injectable } from "@angular/core"

import { Time } from "../../../util"
import { ComponentLayerRef, LevitateOptions } from "../../../layer.module"
import { TimePickerComponent } from "./time-picker.component"
import { AbstractPickerService } from "./abstract"


export interface TimePickerOptions {
    position: LevitateOptions
}


@Injectable()
export class TimePickerService extends AbstractPickerService<TimePickerComponent, string | Date | Time> {
    protected _create(position: LevitateOptions, provides?: StaticProvider[], injector?: Injector): ComponentLayerRef<TimePickerComponent> {
        return this.layerSvc.createFromComponent(TimePickerComponent, this._createBehavior(position), null, provides, null, injector)
    }
}
