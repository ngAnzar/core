import { Directive, AfterContentInit, Inject, Attribute, ElementRef, Input, OnDestroy } from "@angular/core"


export abstract class BoxDirective implements AfterContentInit, OnDestroy {
    public abstract readonly gapMargin: string
    public readonly gap: number

    protected mutationObserver: MutationObserver

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Attribute("gap") gap: string) {
        this.gap = parseInt(gap || "", 10) || 0
    }

    public ngAfterContentInit() {
        if (this.gap) {
            this.updateGap()
            this.mutationObserver = new MutationObserver(mutationsList => {
                // TODO: optimalizálni, hogy csak a szükséges elemeket módosítsa
                this.updateGap()
            })
            this.mutationObserver.observe(this.el.nativeElement, { childList: true })
        }
    }

    protected updateGap() {
        const childNodes = this.el.nativeElement.childNodes
        const childLength = childNodes.length

        for (let i = 0; i < childLength; i++) {
            const child = childNodes[i]
            if (child.nodeType === 1) {
                ((child as HTMLElement).style as any)[this.gapMargin] =
                    i + 1 === childLength ? "0" : `${this.gap}px`
            }
        }
    }

    public ngOnDestroy() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect()
            delete this.mutationObserver
        }
    }
}


@Directive({
    selector: ".nz-vbox, .nz-inline-vbox"
})
export class VboxDirective extends BoxDirective {
    public readonly gapMargin: string = "marginBottom"
}


@Directive({
    selector: ".nz-hbox, .nz-inline-hbox"
})
export class HboxDirective extends BoxDirective {
    public readonly gapMargin: string = "marginRight"
}


@Directive({
    selector: "[flex]",
    host: {
        "[style.flex]": "flex"
    }
})
export class FlexibleDirective {
    @Input() public flex: string
}
