import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { AvatarDirective } from "./directives/avatar.directive"
import { CaptionDirective } from "./directives/caption.directive"
import { ContentDirective } from "./directives/content.directive"
import { DateDirective, TimePipe } from "./directives/date.directive"
import { IconDirective } from "./directives/icon.directive"
import { LabelDirective } from "./directives/label.directive"
import { PostfixDirective } from "./directives/postfix.directive"
import { PrefixDirective } from "./directives/prefix.directive"
import { VboxDirective, HboxDirective, FlexibleDirective } from "./directives/flex.directive"
// import { VirtualForDirective } from "./directives/virtual-for.directive"

export {
    AvatarDirective,
    CaptionDirective,
    ContentDirective,
    DateDirective, TimePipe,
    IconDirective,
    LabelDirective,
    PostfixDirective,
    PrefixDirective,
    VboxDirective,
    HboxDirective,
    FlexibleDirective
}

const content = [
    AvatarDirective,
    CaptionDirective,
    ContentDirective,
    DateDirective, TimePipe,
    IconDirective,
    LabelDirective,
    PostfixDirective,
    PrefixDirective,
    VboxDirective,
    HboxDirective,
    FlexibleDirective
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
