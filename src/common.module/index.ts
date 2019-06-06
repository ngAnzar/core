import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { NzAnimationModule } from "../animation.module"

import { ButtonComponent } from "./button/button.component"
export { ButtonComponent }


import { DragEventService, DragEvent } from "./services/drag-event.service"
import { DragService } from "./drag/drag.service"
import { DragHandleDirective } from "./drag/drag-handle.directive"
export { DragEventService, DragEvent, DragService, DragHandleDirective }


import { LocaleService, DateFormat, LOCALE_DATE } from "./locale/locale.service"
import { DateDirective } from "./locale/date.directive"
import { DatePipe } from "./locale/date.pipe"
import { TimePipe } from "./locale/time.pipe"
export { LocaleService, DateFormat, DateDirective, DatePipe, TimePipe, LOCALE_DATE }


import { PanelComponent, PanelStateEvent, PanelOpeningEvent } from "./panel/panel.component"
import { DrawerComponent } from "./panel/drawer.component"
export { PanelComponent, DrawerComponent, PanelStateEvent, PanelOpeningEvent }


import { NzSlotContent } from "./slot/abstract"
import { ContentDirective, IconDirective, CaptionDirective, PostfixDirective, PrefixDirective } from "./slot/common"
import { LabelDirective } from "./slot/label.directive"
export { NzSlotContent, ContentDirective, IconDirective, CaptionDirective, PostfixDirective, PrefixDirective, LabelDirective }


import { CardComponent, CardHeaderComponent, CardActionsComponent } from "./card/card.component"
export { CardComponent, CardHeaderComponent, CardActionsComponent }


import { ChipComponent } from "./chip/chip.component"
export { ChipComponent }


import { FileDownloadService, FileDownloadEvent } from "./services/file-download.service"
import { PointerEventService } from "./services/pointer-event.service"
import { ScriptService } from "./services/script.service"
import { KeyEventService, SpecialKey, KeyWatcher } from "./services/key-event.service"
import { MediaQueryService } from "./services/media-query.service"
export { FileDownloadService, FileDownloadEvent, PointerEventService, ScriptService, KeyEventService, SpecialKey, KeyWatcher, MediaQueryService }


import { HAMMER_CONFIG } from "./hammer"


const content = [
    ButtonComponent,

    DateDirective,
    DatePipe,
    TimePipe,

    PanelComponent,
    DrawerComponent,

    ContentDirective,
    IconDirective,
    CaptionDirective,
    LabelDirective,
    PostfixDirective,
    PrefixDirective,

    CardComponent,
    CardHeaderComponent,
    CardActionsComponent,

    ChipComponent,

    DragHandleDirective
]


@NgModule({
    imports: [
        CommonModule,
        NzAnimationModule
    ],
    declarations: content,
    exports: content,
    providers: [
        HAMMER_CONFIG,
        LocaleService,
        FileDownloadService,
        ScriptService,
        DragEventService,
        PointerEventService,
        KeyEventService,
        MediaQueryService
    ]
})
export class NzCommonModule { }
