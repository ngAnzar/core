import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import {
    CardComponent,
    CardActionsComponent,
    CardHeaderComponent
} from "./components/card/card.component"


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        CardComponent,
        CardActionsComponent,
        CardHeaderComponent
    ],
    exports: [
        CardComponent,
        CardActionsComponent,
        CardHeaderComponent
    ]
})
export class CardModule {

}
