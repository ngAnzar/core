import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"


export * from "./data"


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
    providers: []
})
export class CoreModule {

}
