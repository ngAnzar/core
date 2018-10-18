import { NgModule } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"

import { ScriptService } from "./services/script.service"


@NgModule({
    imports: [
        BrowserModule
    ],
    providers: [
        ScriptService
    ]
})
export class ServicesModule { }
