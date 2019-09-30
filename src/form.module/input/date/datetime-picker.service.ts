import { Inject } from "@angular/core"
import { ComponentLayerRef, DropdownLayer, LevitateOptions, LayerService } from "../../../layer.module"
import { DatetimePickerComponent } from "./datetime-picker.component"


export interface DatetimePickerOptions {
    position: LevitateOptions,
    crop?: HTMLElement
}



export class DatetimePickerService {
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
