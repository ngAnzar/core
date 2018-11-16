import { NgModule } from "@angular/core"

import { MaskRef, MaskStyle } from "./mask-ref"
import { MaskService } from "./mask.service"
export { MaskRef, MaskService, MaskStyle }

@NgModule({
    providers: [MaskService]
})
export class MaskModule { }
