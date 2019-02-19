import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FlexLayoutModule } from "@angular/flex-layout"

import { NzCommonModule } from "../common.module"
import { NzListModule } from "../list.module"
import { NzFormModule } from "../form.module"
import { NzDataModule } from "../data.module"
import { NzLayerModule } from "../layer.module"


import { NavbarComponent } from "./navbar/navbar.component"
import { NavbarSearchComponent } from "./navbar/navbar-search.component"
export { NavbarComponent, NavbarSearchComponent }

import { SidenavComponent } from "./sidenav/sidenav.component"
export { SidenavComponent }

import { ViewportComponent } from "./viewport/viewport.component"
import { ViewportAreaDirective } from "./viewport/viewport-area.directive"
import { ViewportItemDirective } from "./viewport/viewport-item.directive"
import { ViewportContentComponent } from "./viewport/viewport-content.component"

import { ViewportService } from "./viewport.service"
export { ViewportService }


@NgModule({
    imports: [
        CommonModule,
        FlexLayoutModule,
        NzCommonModule,
        NzListModule,
        NzFormModule,
        NzDataModule,
        NzLayerModule
    ],
    declarations: [
        NavbarComponent,
        NavbarSearchComponent,
        SidenavComponent,
        ViewportComponent,
        ViewportAreaDirective,
        ViewportItemDirective,
        ViewportContentComponent
    ],
    exports: [
        NavbarComponent,
        NavbarSearchComponent,
        SidenavComponent,
        ViewportComponent,
        ViewportAreaDirective,
        ViewportItemDirective
    ]
})
export class NzViewportModule {

}
