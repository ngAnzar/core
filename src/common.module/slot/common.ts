import { Directive, Input, HostBinding } from "@angular/core"

import { NzSlotContent } from "./abstract"


@Directive({ selector: "[nzSlot='content']", providers: [{ provide: NzSlotContent, useExisting: ContentDirective }] })
export class ContentDirective extends NzSlotContent {
    public readonly slot: string = "content"
}

@Directive({ selector: "[nzSlot='postfix']", providers: [{ provide: NzSlotContent, useExisting: PostfixDirective }] })
export class PostfixDirective extends NzSlotContent {
    public readonly slot: string = "postfix"
}

@Directive({ selector: "[nzSlot='prefix']", providers: [{ provide: NzSlotContent, useExisting: PrefixDirective }] })
export class PrefixDirective extends NzSlotContent {
    public readonly slot: string = "prefix"
}

@Directive({ selector: "[nzSlot='caption'], caption", providers: [{ provide: NzSlotContent, useExisting: CaptionDirective }] })
export class CaptionDirective extends NzSlotContent {
    public readonly slot: string = "caption"
}

@Directive({ selector: "[nzSlot='icon'], nz-icon, .nz-icon", providers: [{ provide: NzSlotContent, useExisting: IconDirective }] })
export class IconDirective extends NzSlotContent {
    public readonly slot: string = "icon"

    @Input()
    @HostBinding("attr.color")
    public color: string
}
