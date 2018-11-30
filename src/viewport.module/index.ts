import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"


import { NavbarComponent } from "./navbar/navbar.component"
export { NavbarComponent }

import { NavbarSearchComponent } from "./navbar/navbar-search.component"
export { NavbarSearchComponent }


@NgModule({
    imports: [
        CommonModule
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
export class NzViewportModule {

}
