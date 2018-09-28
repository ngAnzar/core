import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"


export { DataSource } from "./data/data-source"
export { StaticSource } from "./data/static-source"
// import { DataSourceDirective } from "./data/data-source.directive"
// import { ScrollerComponent } from "./components/scroller/scroller.component"


const content: any[] = [
    // ScrollerComponent
    // DataSourceDirective
]


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: content,
    exports: content
})
export class CoreModule {

}
