import { NgModule, StaticProvider } from "@angular/core"

import { ServicesModule } from "./services.module"
import { LocationService, LocationDataSource, Location } from "./google/location.service"
export { LocationService, LocationDataSource, Location }

import { GOOGLE_API_KEY } from "./google/api-key"
export { GOOGLE_API_KEY }


@NgModule({
    imports: [
        ServicesModule
    ],
    providers: [
        LocationService,
        LocationDataSource
    ]
})
export class GoogleModule {
    public static provideApikey(key: string): StaticProvider {
        return { provide: GOOGLE_API_KEY, useValue: key }
    }
}
