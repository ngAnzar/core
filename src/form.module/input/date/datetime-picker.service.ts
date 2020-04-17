import { Inject, StaticProvider, Injector } from "@angular/core"
import { ComponentLayerRef, DropdownLayer, LevitateOptions, LayerService } from "../../../layer.module"
import { DatetimePickerComponent } from "./datetime-picker.component"
import { AbstractPickerService } from "./abstract"


export interface DatetimePickerOptions {
    position: LevitateOptions,
    crop?: HTMLElement
}



export class DatetimePickerService extends AbstractPickerService<DatetimePickerComponent, Date> {
    protected _create(position: LevitateOptions, provides?: StaticProvider[], injector?: Injector): ComponentLayerRef<DatetimePickerComponent> {
        return this.layerSvc.createFromComponent(DatetimePickerComponent, this._createBehavior(position), null, provides, null, injector)
    }
}

export class _DatetimePickerService {
    public constructor(
        @Inject(LayerService) protected readonly layerSvc: LayerService) {
    }

    public show(options: DatetimePickerOptions): ComponentLayerRef<DatetimePickerComponent> {
        const behavior = new DropdownLayer({
            position: options.position,
            backdrop: { type: "empty", hideOnClick: true, crop: options.crop },
            elevation: 10,
            rounded: 3
        })
        const ref = this.layerSvc.createFromComponent(DatetimePickerComponent, behavior)
        return ref
    }
}
