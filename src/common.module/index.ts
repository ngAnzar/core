import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { NzAnimationModule } from "../animation.module"

import { ButtonComponent } from "./button/button.component"
import { ButtonProgressComponent } from "./button/button-progress.component"
export { ButtonComponent, ButtonProgressComponent }


import { DragEventService, DragEvent } from "./services/drag-event.service"
import { DragService } from "./drag/drag.service"
import { DragHandleDirective } from "./drag/drag-handle.directive"
export { DragEventService, DragEvent, DragService, DragHandleDirective }

import { LinkDirective } from "./link/link.directive"
export { LinkDirective }

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

import { Nl2BrPipe } from "./directives/nl2br.directive"

import { FileDownloadService, FileDownloadEvent } from "./services/file-download.service"
import { FileUploadService, FileUploadEvent } from "./services/file-upload.service"
import { TouchEventService, TOUCH_EVENT_PLUGIN, NzTouchEvent, TouchPoint } from "./services/touch-event.service"
import { ScriptService } from "./services/script.service"
import { CssService, CssProps } from "./services/css.service"
// import { KeyEventService, SpecialKey, KeyWatcher } from "./services/key-event.service"
import { MediaQueryService } from "./services/media-query.service"
import { CordovaService } from "./services/cordova.service"
export {
    FileDownloadService, FileDownloadEvent,
    FileUploadService, FileUploadEvent,
    TouchEventService, TouchPoint, ScriptService, MediaQueryService,
    TOUCH_EVENT_PLUGIN, NzTouchEvent,
    CordovaService, CssService, CssProps
}

import { ShortcutService } from "./shortcut/shortcut.service"
export { ShortcutService }
export { Shortcuts, ShortcutDef, ShortcutHandler, Shortcut } from "./shortcut/shortcuts"

import { LocalStorageService, LocalStorageBucket } from "./services/local-storage.service"
export { LocalStorageService, LocalStorageBucket }

import { NzRouterLink, NzRouterLinkHref } from "./ngpatches/router-link"

export { ImageRef, ImageRefSource, CropRegion } from "./image/image-ref"
import { ImageComponent } from "./image/image.component"


const content = [
    ButtonComponent,
    ButtonProgressComponent,

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
    Nl2BrPipe,

    DragHandleDirective,

    NzRouterLink,
    NzRouterLinkHref,

    LinkDirective,

    ImageComponent
]


@NgModule({
    imports: [
        CommonModule,
        NzAnimationModule
    ],
    declarations: content,
    exports: content,
    providers: [
        LocaleService,
        FileDownloadService,
        FileUploadService,
        ScriptService,
        DragEventService,
        MediaQueryService,
        ShortcutService,
        TouchEventService,
        TOUCH_EVENT_PLUGIN,
        LocalStorageService,
        CordovaService,
        CssService,
    ]
})
export class NzCommonModule { }
