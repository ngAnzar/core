import { Inject } from "@angular/core"
import { ComponentLayerRef, DropdownLayer, LevitateOptions, LayerService } from "../../../layer.module"
import { TimePickerComponent } from "./time-picker.component"


export interface TimePickerOptions {
    position: LevitateOptions
}



export class TimePickerService {
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
