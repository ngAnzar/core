import { Inject, StaticProvider, Injector, Injectable } from "@angular/core"
import { ComponentLayerRef, DropdownLayer, LevitateOptions, LayerService } from "../../../layer.module"
import { DatetimePickerComponent } from "./datetime-picker.component"
import { AbstractPickerService } from "./abstract"


export interface DatetimePickerOptions {
    position: LevitateOptions,
    crop?: HTMLElement
}


@Injectable()
export class DatetimePickerService extends AbstractPickerService<DatetimePickerComponent, Date> {
    protected _create(position: LevitateOptions, provides?: StaticProvider[], injector?: Injector): ComponentLayerRef<DatetimePickerComponent> {
        return this.layerSvc.createFromComponent(DatetimePickerComponent, this._createBehavior(position), null, provides, null, injector)
    }
}
