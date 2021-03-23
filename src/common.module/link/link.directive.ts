import { Directive, HostBinding, Inject, Input, OnChanges, SimpleChanges } from "@angular/core"
import { DomSanitizer, SafeUrl } from "@angular/platform-browser"


@Directive({
    selector: ".nz-link"
})
export class LinkDirective implements OnChanges {
    @Input()
    public href: string

    @HostBinding("attr.href")
    public _href: SafeUrl = this.sanitizer.bypassSecurityTrustUrl("javascript:;")

    public constructor(@Inject(DomSanitizer) private readonly sanitizer: DomSanitizer) {

    }

    public ngOnChanges(changes: SimpleChanges) {
        if ("href" in changes) {
            this._href = changes.href.currentValue
        }
    }
}
