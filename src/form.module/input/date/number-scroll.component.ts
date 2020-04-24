import {
    Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy, Directive, forwardRef,
    ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter
} from "@angular/core"

import { NzTouchEvent } from "../../../common.module"



export type Numbers = Array<{ value: number, label: string }>

export abstract class NumberGenerator {
    public abstract generate(center?: number): Numbers
}

export abstract class InfiniteGen extends NumberGenerator {
    protected _generate(begin: number, end: number, step: number, center?: number): Numbers {
        if (center == null) {
            center = begin
        }

        let res: Numbers = []

        for (let i = center - step * 3, l = center + step * 3; i < l; i++) {

            if (i < begin) {
                let value = end + (i + step)
                res.push({ value, label: `${value < 10 ? '0' : ''}${value}` })
            } else if (i > end) {
                let value = -(end - (i - step))
                res.push({ value, label: `${value < 10 ? '0' : ''}${value}` })
            } else {
                res.push({ value: i, label: `${i < 10 ? '0' : ''}${i}` })
            }
        }

        return res
    }
}


@Directive({
    selector: ".nz-number-scroll[type='year']",
    providers: [
        { provide: NumberGenerator, useExisting: forwardRef(() => YearGenerator) }
    ]
})
export class YearGenerator extends NumberGenerator {
    public generate(center?: number): Numbers {
        if (center == null) {
            center = new Date().getFullYear()
        }

        let res: Numbers = []
        for (let i = center - 3, l = center + 3; i <= l; i++) {
            res.push({ value: i, label: `${i}` })
        }

        return res
    }
}

@Directive({
    selector: ".nz-number-scroll[type='month']",
    providers: [
        { provide: NumberGenerator, useExisting: forwardRef(() => MonthGenerator) }
    ]
})
export class MonthGenerator extends InfiniteGen {
    public generate(center?: number): Numbers {
        return this._generate(1, 12, 1, center)
    }
}


@Directive({
    selector: ".nz-number-scroll[type='say']",
    providers: [
        { provide: NumberGenerator, useExisting: forwardRef(() => DayGenerator) }
    ]
})
export class DayGenerator extends InfiniteGen {
    @Input() public year: number
    @Input() public month: number

    public generate(center?: number): Numbers {
        return this._generate(1, 31, 1, center)
    }
}


@Directive({
    selector: ".nz-number-scroll[type='hour']",
    providers: [
        { provide: NumberGenerator, useExisting: forwardRef(() => HourGenerator) }
    ]
})
export class HourGenerator extends InfiniteGen {
    public generate(center?: number): Numbers {
        return this._generate(0, 23, 1, center)
    }
}


@Directive({
    selector: ".nz-number-scroll[type='minute']",
    providers: [
        { provide: NumberGenerator, useExisting: forwardRef(() => MinuteGenerator) }
    ]
})
export class MinuteGenerator extends InfiniteGen {
    public generate(center?: number): Numbers {
        return this._generate(0, 59, 1, center)
    }
}


@Component({
    selector: ".nz-number-scroll",
    templateUrl: "./number-scroll.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NumberScrollComponent implements AfterViewInit {
    @ViewChild("strip", { read: ElementRef, static: true }) public readonly strip: ElementRef<HTMLElement>

    @Input()
    public set value(val: number) {
        if (this._value !== val) {
            this._value = val
            this.valueChange.emit(val)

            this.numbers = this.generator.generate(val)
            this.centerIndex = this.numbers.findIndex(f => f.value === val)
            this.cdr.markForCheck()
            const el = this.strip.nativeElement
            el.style.transform = `translateY(-${(this.centerIndex - 1) * 36}px)`
        }
    }
    public get value(): number { return this._value }
    private _value: number

    @Output("value") public readonly valueChange = new EventEmitter<Number>()

    public numbers: Numbers

    public centerIndex: number = 3

    public constructor(
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(NumberGenerator) private readonly generator: NumberGenerator) {
        this.numbers = generator.generate()
    }

    public ngAfterViewInit() {
        this.scroll(0)
    }

    public up(count: number) {
        this.scroll(-count)
    }

    public down(count: number) {
        this.scroll(count)
    }

    public onWheel(event: WheelEvent) {
        if (event.deltaY < 0) {
            this.scroll(-1)
        } else {
            this.scroll(1)
        }
    }

    public onPan(event: NzTouchEvent) {

    }

    protected scroll(amount: number) {
        let newCenter = Math.max(0, this.centerIndex + amount)
        let newValue = this.numbers[newCenter]

        if (newValue != null) {
            this.value = newValue.value
        } else {
            let numbers = this.generator.generate()
            let idx = Math.ceil(this.numbers.length / 2)
            this.value = numbers[idx].value
        }
    }

    public _trackNumber(index: number, item: any): any {
        return item.value
    }
}
