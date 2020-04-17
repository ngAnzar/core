import { Inject, StaticProvider, Injector } from "@angular/core"
import { take } from "rxjs/operators"

import { LayerService, DropdownLayer, LevitateOptions, ComponentLayerRef } from "../../../layer.module"
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


export class DatePickerService extends AbstractPickerService<DatePickerComponent, Date> {
    protected _create(position: LevitateOptions, provides?: StaticProvider[], injector?: Injector): ComponentLayerRef<DatePickerComponent> {
        return this.layerSvc.createFromComponent(DatePickerComponent, this._createBehavior(position), null, provides, null, injector)
    }
}

/*
export class _DatePickerService {
    public constructor(
        @Inject(LayerService) protected readonly layerSvc: LayerService) {
    }

    public show(options: DatePickerOptions, provides?: StaticProvider[], injector?: Injector): ComponentLayerRef<DatePickerComponent> {
        const behavior = new DropdownLayer({
            position: options.position,
            backdrop: { type: "empty", hideOnClick: true },
            elevation: 10,
            rounded: 3
        })

        if (options.position.anchor && options.position.anchor.ref instanceof HTMLElement) {
            behavior.options.backdrop.crop = options.position.anchor.ref
        }

        let layer = this.layerSvc.createFromComponent(DatePickerComponent, behavior, null, provides, null, injector)
        layer.show()

        let cmp = layer.component.instance

        if (options.initial) {
            cmp.displayed = options.initial
        } else {
            cmp.displayed = new Date()
        }

        if (options.value) {
            cmp.writeValue(options.value)
        }

        if (options.min) {
            cmp.min = options.min
        }

        if (options.max) {
            cmp.max = options.max
        }

        cmp.valueChange.pipe(take(1)).subscribe(() => {
            layer.hide()
        })

        return layer
    }
}
*/
