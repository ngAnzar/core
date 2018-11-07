import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { SelectModule } from "./select.module"

import { NavbarComponent } from "./components/navbar/navbar.component"
import { NavbarSearchComponent } from "./components/navbar/navbar-search.component"


@NgModule({
    imports: [
        CommonModule,
        SelectModule
    ],
    declarations: [
        NavbarComponent,
        NavbarSearchComponent
    ],
    exports: [
        NavbarComponent,
        NavbarSearchComponent
    ]
})
export class NavbarModule { }
