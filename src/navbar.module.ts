import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { NavbarComponent } from "./components/navbar/navbar.component"


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        NavbarComponent
    ],
    exports: [
        NavbarComponent
    ]
})
export class NavbarModule { }
