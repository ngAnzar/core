import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { FlexLayoutModule } from "@angular/flex-layout"

import { NzCommonModule } from "../common.module"
import { NzListModule } from "../list.module"


import { NavbarComponent } from "./navbar/navbar.component"
export { NavbarComponent }

import { SidenavComponent } from "./sidenav/sidenav.component"
export { SidenavComponent }

import { ViewportComponent } from "./viewport/viewport.component"
import { ViewportAreaDirective } from "./viewport/viewport-area.directive"
import { ViewportItemDirective } from "./viewport/viewport-item.directive"
import { ViewportContentComponent } from "./viewport/viewport-content.component"

import { ViewportService } from "./viewport.service"
export { ViewportService }

// import { NavbarComponent } from "./navbar/navbar.component"
// export { NavbarComponent }

// import { NavbarSearchComponent } from "./navbar/navbar-search.component"
// export { NavbarSearchComponent }


@NgModule({
    imports: [
        CommonModule,
        FlexLayoutModule,
        BrowserAnimationsModule,
        NzCommonModule,
        NzListModule
    ],
    declarations: [
        NavbarComponent,
        SidenavComponent,
        ViewportComponent,
        ViewportAreaDirective,
        ViewportItemDirective,
        ViewportContentComponent
    ],
    exports: [
        NavbarComponent,
        SidenavComponent,
        ViewportComponent,
        ViewportAreaDirective,
        ViewportItemDirective
    ],
    providers: [
        ViewportService
    ]
})
export class NzViewportModule {

}
