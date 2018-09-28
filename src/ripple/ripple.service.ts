import { Injectable, ElementRef, Inject, Renderer2, EventEmitter } from "@angular/core"
import { FocusOrigin } from '@angular/cdk/a11y';
import { take } from "rxjs/operators"


export interface RippleConfig {
    x?: number,
    y?: number,
    centered?: boolean,
    radius?: number,
    yoyo?: boolean,
    duration?: number
}


export class BoundedRipple {
    private _focus: Ripple

    constructor(protected service: RippleService,
        protected trigger: ElementRef<HTMLElement>,
        protected container: ElementRef<HTMLElement>,
        protected renderer: Renderer2) {

        this.trigger.nativeElement.addEventListener("mousedown", this._onMouseDown)
        this.trigger.nativeElement.addEventListener("touchstart", this._onTouchStart)
    }

    public dispose() {
        this.trigger.nativeElement.removeEventListener("mousedown", this._onMouseDown)
        this.trigger.nativeElement.removeEventListener("touchstart", this._onMouseDown)

        delete this.service
        delete this.trigger
        delete this.container
        delete this.renderer
    }

    public handleFocus = (origin: FocusOrigin) => {
        if (origin === "keyboard" || origin === "program") {
            if (!this._focus) {
                this._focus = this.service.launch(this.container, {
                    centered: true,
                    yoyo: true
                })
                this._focus.onDestroy.pipe(take(1)).subscribe(() => {
                    this._focus = null
                })
            }
        } else if (this._focus) {
            this._focus.destroy()
        }
    }

    protected _onMouseDown = (event: MouseEvent) => {
        if (event.defaultPrevented) {
            return
        }

        if (this._focus) {
            this._focus.destroy()
        }

        const bound = this.container.nativeElement.getBoundingClientRect()
        this.service.launch(this.container, {
            x: event.clientX - bound.left,
            y: event.clientY - bound.top
        })
    }

    protected _onTouchStart = (event: TouchEvent) => {
        if (event.defaultPrevented) {
            return
        }

        if (this._focus) {
            this._focus.destroy()
        }

        const touches = event.changedTouches
        const bound = this.container.nativeElement.getBoundingClientRect()

        for (let i = 0; i < touches.length; i++) {
            this.service.launch(this.container, {
                x: touches[i].clientX - bound.left,
                y: touches[i].clientY - bound.top
            })
        }
    }
}


const YOYO_SCALE_1 = 0.7
const YOYO_SCALE_2 = 0.8


export class Ripple {
    public readonly onDestroy: EventEmitter<void> = new EventEmitter()
    protected rippleEl: HTMLElement

    public disabled: boolean
    protected destroyed: boolean

    constructor(public readonly config: RippleConfig,
        protected readonly container: HTMLElement,
        protected renderer: Renderer2) {

    }

    public async play(): Promise<void> {
        if (this.disabled) {
            return
        }

        if (!this.config.yoyo) {
            await this.showAnim()
            await this.hideAnim()
            this.destroy()
        } else {
            this.showAnim()
            let fristScale = true

            return new Promise<void>((resolve, reject) => {
                setInterval(() => {
                    if (this.rippleEl) {
                        fristScale = !fristScale
                        window.getComputedStyle(this.rippleEl).getPropertyValue("opacity")
                        this.rippleEl.style.transform = `scale(${fristScale ? YOYO_SCALE_1 : YOYO_SCALE_2})`
                    } else {
                        resolve()
                    }
                }, this.config.duration)
            })

        }
    }

    public async showAnim(): Promise<void> {
        const bounds = this.container.getBoundingClientRect()

        if (this.config.centered) {
            this.config.x = bounds.width / 2
            this.config.y = bounds.height / 2
        }

        if (!this.config.radius) {
            this.config.radius = this.maxPossibleRadius(this.config.x, this.config.y, bounds)
        }

        if (!this.config.duration) {
            this.config.duration = 600
        }

        this.rippleEl = this.createElement()
        this.renderer.appendChild(this.container, this.rippleEl)
        // enforce style recalculation
        window.getComputedStyle(this.rippleEl).getPropertyValue("opacity")

        this.rippleEl.style.transform = this.config.yoyo ? `scale(${YOYO_SCALE_1})` : "scale(1)"

        return new Promise<void>((resolve, reject) => {
            setTimeout(resolve, this.config.duration)
        })
    }

    public async hideAnim(): Promise<void> {
        if (this.rippleEl) {
            this.rippleEl.style.opacity = "0"
            this.rippleEl.style.transitionDuration = `${this.config.duration / 2}ms`
        }

        return new Promise<void>((resolve, reject) => {
            setTimeout(resolve, this.config.duration / 2)
        })
    }

    protected createElement(): HTMLElement {
        const el = this.renderer.createElement("span") as HTMLElement

        el.classList.add("nz-ripple")
        el.style.display = "block"
        el.style.position = "absolute"
        el.style.borderRadius = "50%"
        el.style.pointerEvents = "none"
        el.style.left = `${this.config.x - this.config.radius}px`
        el.style.top = `${this.config.y - this.config.radius}px`
        el.style.width = `${this.config.radius * 2}px`
        el.style.height = `${this.config.radius * 2}px`
        el.style.opacity = "0.2"

        el.style.transform = "scale(0)"
        el.style.transition = `opacity, transform 0ms cubic-bezier(0, 0, 0.2, 1)`
        el.style.transitionDuration = `${this.config.duration}ms`

        return el
    }

    public destroy() {
        if (!this.destroyed) {
            this.destroyed = true
            this.onDestroy.emit()
            this.renderer.removeChild(this.container, this.rippleEl)
            delete this.rippleEl
            delete this.renderer
        }
    }

    protected maxPossibleRadius(x: number, y: number, rect: ClientRect) {
        const distX = Math.max(x, Math.abs(rect.width - x));
        const distY = Math.max(y, Math.abs(rect.height - y));
        return Math.sqrt(distX * distX + distY * distY);
    }
}


@Injectable({
    providedIn: "root"
})
export class RippleService {
    protected ripples: Ripple[] = []

    constructor(@Inject(Renderer2) protected renderer: Renderer2) {

    }

    public attach(trigger: ElementRef, container: ElementRef): BoundedRipple {
        return new BoundedRipple(this, trigger, container, this.renderer)
    }

    public launch(container: ElementRef, config: RippleConfig): Ripple {
        const ripple = new Ripple(config, container.nativeElement, this.renderer)
        this.ripples.push(ripple)
        ripple.play()
        ripple.onDestroy.pipe(take(1)).subscribe(() => {
            let i = this.ripples.indexOf(ripple)
            if (i > -1) {
                this.ripples.splice(i, 1)
            }
        })
        return ripple
    }

    public dispose() {
        while (this.ripples.length) {
            this.ripples.shift().destroy()
        }
    }
}
