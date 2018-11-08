import { Directive, Input, HostListener, ElementRef, Inject } from "@angular/core"

import { MenuComponent } from "./menu.component"


@Directive({
    selector: "[menuTrigger]",
    host: {
        "[style.cursor]": "'pointer'"
    }
})
export class MenuTriggerDirective {
    @Input() public menuTrigger: MenuComponent

    public constructor(@Inject(ElementRef) public readonly el: ElementRef<HTMLElement>) {
    }

    @HostListener("click", ["$event"])
    protected onClick(event: MouseEvent) {
        event.preventDefault()

        if (this.menuTrigger.backdrop) {
            this.menuTrigger.backdrop.crop = this.el.nativeElement
        }

        if (this.menuTrigger.isVisible) {
            this.menuTrigger.hide()
        } else {
            this.menuTrigger.show({
                align: "left bottom",
                ref: this.el.nativeElement
            })
        }
    }
}
