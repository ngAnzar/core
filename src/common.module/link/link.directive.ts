import { Directive, HostBinding, Inject } from "@angular/core"
import { DomSanitizer } from "@angular/platform-browser"


@Directive({
    selector: ".nz-link"
})
export class LinkDirective {
    @HostBinding("attr.href") public href = this.sanitizer.bypassSecurityTrustUrl("javascript:;")

    public constructor(@Inject(DomSanitizer) private readonly sanitizer: DomSanitizer) {

    }
}
