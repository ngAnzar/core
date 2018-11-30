import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"


import { NavbarComponent } from "./navbar/navbar.component"
export { NavbarComponent }

export { NavbarSearchComponent } from "./navbar/navbar-search.component"


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
export class ViewportModule {

}
