import { Directive, Input, HostBinding } from "@angular/core"

import { NzSlotContent } from "./abstract"


@Directive({ selector: "[nzSlot='content']", providers: [{ provide: NzSlotContent, useExisting: ContentDirective }] })
export class ContentDirective extends NzSlotContent { }

@Directive({ selector: "[nzSlot='postfix']", providers: [{ provide: NzSlotContent, useExisting: PostfixDirective }] })
export class PostfixDirective extends NzSlotContent { }

@Directive({ selector: "[nzSlot='prefix']", providers: [{ provide: NzSlotContent, useExisting: PrefixDirective }] })
export class PrefixDirective extends NzSlotContent { }

@Directive({ selector: "[nzSlot='label'], label", providers: [{ provide: NzSlotContent, useExisting: LabelDirective }] })
export class LabelDirective extends NzSlotContent { }

@Directive({ selector: "[nzSlot='caption'], caption", providers: [{ provide: NzSlotContent, useExisting: CaptionDirective }] })
export class CaptionDirective extends NzSlotContent { }

@Directive({ selector: "[nzSlot='icon'], nz-icon", providers: [{ provide: NzSlotContent, useExisting: IconDirective }] })
export class IconDirective extends NzSlotContent {
    @Input()
    @HostBinding("attr.color")
    public color: string
}
