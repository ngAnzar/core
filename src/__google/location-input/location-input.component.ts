import { Component, Inject, Optional, Renderer2, ElementRef } from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"

import { InputComponent, INPUT_VALUE_ACCESSOR } from "../../input.module"
import { LocationService, Location } from "./location.service"


@Component({
    selector: ".nz-location-input",
    templateUrl: "location-input.template.pug",
    host: {
        "[attr.id]": "id",
        "(focus)": "_handleFocus(true)",
        "(blur)": "_handleFocus(false)",
        "(input)": "_handleInput($event.target.value)"
    },
    providers: [
        { provide: InputComponent, useExisting: LocationInputComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class LocationInputComponent extends InputComponent<Location> {
    public get type(): string { return "text" }

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(Renderer2) _renderer: Renderer2,
        @Inject(ElementRef) el: ElementRef,
        @Inject(LocationService) protected readonly locationSvc: LocationService) {
        super(ngControl, ngModel, _renderer, el)
        locationSvc.getLocationSource().subscribe(lds => {
            console.log(lds)
            lds.search({ label: "XIII: Kerület" }).subscribe(locations => {
                console.log(locations)
            })
        })
    }

    public writeValue(value: Location): void {

    }
}
