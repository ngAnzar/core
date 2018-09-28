import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { CaptionDirective } from "./directives/caption.directive"
import { ContentDirective } from "./directives/content.directive"
import { IconDirective } from "./directives/icon.directive"
import { LabelDirective } from "./directives/label.directive"
import { PostfixDirective } from "./directives/postfix.directive"
import { PrefixDirective } from "./directives/prefix.directive"
// import { VirtualForDirective } from "./directives/virtual-for.directive"

export {
    CaptionDirective,
    ContentDirective,
    IconDirective,
    LabelDirective,
    PostfixDirective,
    PrefixDirective
}

const content = [
    CaptionDirective,
    ContentDirective,
    IconDirective,
    LabelDirective,
    PostfixDirective,
    PrefixDirective
]

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: content,
    exports: content
})
export class DirectivesModule {

}
