import { Inject, StaticProvider, Injector } from "@angular/core"

import { Time } from "../../../util"
import { ComponentLayerRef, DropdownLayer, LevitateOptions, LayerService } from "../../../layer.module"
import { TimePickerComponent } from "./time-picker.component"
import { AbstractPickerService } from "./abstract"


export interface TimePickerOptions {
    position: LevitateOptions
}

export class TimePickerService extends AbstractPickerService<TimePickerComponent, string | Date | Time> {
    protected _create(position: LevitateOptions, provides?: StaticProvider[], injector?: Injector): ComponentLayerRef<TimePickerComponent> {
        return this.layerSvc.createFromComponent(TimePickerComponent, this._createBehavior(position), null, provides, null, injector)
    }
}


export class _TimePickerService {
    public constructor(
        @Inject(LayerService) protected readonly layerSvc: LayerService) {
    }

    public show(options: TimePickerOptions): ComponentLayerRef<TimePickerComponent> {
        const behavior = new DropdownLayer({
            position: options.position,
            backdrop: { type: "empty", hideOnClick: true },
            elevation: 10,
            rounded: 3
        })
        const ref = this.layerSvc.createFromComponent(TimePickerComponent, behavior)
        return ref
    }
}
