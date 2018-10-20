import { NgModule } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"

import { ScriptService } from "./services/script.service"
import { RectMutationService } from "./rect-mutation.service"
import { LevitateService } from "./levitate/levitate.service"

export { ScriptService, RectMutationService }

@NgModule({
    imports: [
        BrowserModule
    ],
    providers: [
        ScriptService,
        RectMutationService,
        LevitateService
    ]
})
export class ServicesModule { }
