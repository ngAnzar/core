import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"


export * from "./data"
import { ResizeObserver } from "./observers/resize-observer"
export { ResizeObserver }
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
    exports: content,
    providers: [ResizeObserver]
})
export class CoreModule {

}
