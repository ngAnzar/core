import { NgModule } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"

import { ScriptService } from "./services/script.service"
import { RectMutationService } from "./rect-mutation.service"
import { LevitateService } from "./levitate/levitate.service"
import { FileDownloadService } from "./services/file-download.service"

export { ScriptService, RectMutationService, FileDownloadService }

@NgModule({
    imports: [
        BrowserModule
    ],
    providers: [
        ScriptService,
        RectMutationService,
        LevitateService,
        FileDownloadService
    ]
})
export class ServicesModule { }
