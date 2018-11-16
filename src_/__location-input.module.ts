import { NgModule, InjectionToken, StaticProvider } from "@angular/core"

import { GoogleModule } from "./google.module"
import { InputModule } from "./input.module"

import { LocationInputComponent } from "./google/location-input/location-input.component"
import { LocationService, LocationDataSource, Location } from "./google/location-input/location.service"
export { LocationService, LocationDataSource, Location }

@NgModule({
    imports: [
        GoogleModule,
        InputModule
    ],
    declarations: [
        LocationInputComponent
    ],
    exports: [
        LocationInputComponent,

        GoogleModule,
        InputModule
    ],
    providers: [
        LocationService,
        LocationDataSource
    ]
})
export class LocationInputModule { }
