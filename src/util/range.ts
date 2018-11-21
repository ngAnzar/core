
export class NzRange {
    constructor(public readonly begin: number,
        public readonly end: number) { }

    public get length(): number {
        return this.end - this.begin
    }

    public merge(r: NzRange): NzRange {
        return new NzRange(
            Math.min(this.begin, r.begin),
            Math.max(this.end, r.end))
    }

    // public extend(r: Range): Range {
    //     (this as any).begin = Math.min(this.begin, r.begin);
    //     (this as any).end = Math.max(this.end, r.end);
    //     return this
    // }

    public isOverlap(other: NzRange): boolean {
        return Math.max(this.begin, other.begin) <= Math.min(this.end, other.end)
    }

    public contains(n: number): boolean {
        return this.begin <= n && this.end >= n
    }

    public copy(): NzRange {
        return new NzRange(this.begin, this.end)
    }

    public diff(r: NzRange): NzRangeList {
        if (!this.isOverlap(r)) {
            return new NzRangeList(this, r)
        }

        let res = new NzRangeList()
        if (this.begin < r.begin) {
            res.push(new NzRange(this.begin, r.begin))
        } else {
            res.push(new NzRange(r.begin, this.begin))
        }

        if (this.end < r.end) {
            res.push(new NzRange(this.end, r.end))
        } else {
            res.push(new NzRange(r.end, this.end))
        }

        return res.filter(r => r.begin != r.end)
    }

    public isEq(other: NzRange): boolean {
        return this.begin === other.begin && this.end === other.end
    }

    public shift(amount: number): NzRange {
        return new NzRange(this.begin + amount, this.end + amount)
    }
}


export class NzRangeList extends Array<NzRange> {
    public push(...ranges: NzRange[]): number {
        for (let r of ranges) {
            let inserted = false
            for (let e of this) {
                if (r.begin <= e.begin) {
                    this.splice(this.indexOf(e), 0, r)
                    inserted = true
                    break
                }
            }
            if (!inserted) {
                super.push(r)
            }
        }
        return 0
    }

    public concat(other: NzRangeList): NzRangeList {
        let res = new NzRangeList()
        for (let r of this) {
            res.push(r)
        }
        for (let r of other) {
            res.push(r)
        }
        return res
    }

    public filter(cb: (item: NzRange, index: number, self: this) => boolean): NzRangeList {
        return new NzRangeList(...super.filter(cb))
    }

    public unique(): NzRangeList {
        return new NzRangeList(...super.filter((item, i) => super.findIndex(x => x.isEq(item)) === i))
    }

    public sorted(): NzRangeList {
        return new NzRangeList(...super.sort((a, b) => a.begin - b.begin))
    }

    public copy() {
        let rl = []
        for (let r of this) {
            rl.push(r.copy())
        }
        return new NzRangeList(...rl)
    }

    public contains(other: NzRange | NzRangeList): boolean {
        if (other instanceof NzRange) {
            for (let r of this) {
                if ((r.contains(other.begin) && r.contains(other.end))) {
                    return true
                }
            }
        } else {
            for (let r of other) {
                if (this.contains(r)) {
                    return true
                }
            }
        }
        return false
    }

    public merge(...others: Array<NzRangeList | NzRange>): NzRangeList {
        let flattened = new NzRangeList(...this)

        for (let o of others) {
            if (o instanceof NzRange) {
                flattened.push(o)
            } else {
                for (let r of o) {
                    flattened.push(r)
                }
            }
        }

        let result: NzRangeList = new NzRangeList()

        for (let a of flattened) {
            let ok = false

            for (let i = 0, l = result.length; i < l; i++) {
                let b = result[i]
                if (!a.isEq(b) && a.isOverlap(b)) {
                    let nr = b.merge(a)
                    result[i] = nr
                    ok = true
                }
            }

            if (!ok) {
                result.push(a)
            }
        }

        return result
    }

    public diff(other: NzRange | NzRangeList): NzRangeList {
        if (other instanceof NzRange) {
            other = new NzRangeList(other)
        }

        let res = new NzRangeList()
        let sub: { [key: string]: [NzRange, NzRangeList] } = {}

        for (let a of this) {
            let k = `${a.begin}-${a.end}`
            let ok = false

            for (let b of other) {
                if (a.isOverlap(b)) {
                    ok = true

                    if (k in sub) {
                        sub[k][1].push(b)
                    } else {
                        sub[k] = [a, new NzRangeList(b)]
                    }
                }
            }

            if (!ok) {
                res.push(a)
            }
        }


        for (let b of other) {
            if (!this.contains(b)) {
                res.push(b)
            }
        }

        for (let k in sub) {
            let s = sub[k]
            let x = [s[0]]

            for (let d of s[1]) {
                let xx = x.map(item => item.diff(d))
                x = []
                for (let i of xx) {
                    x = x.concat(i)
                }
            }

            for (let r of x) {
                res.push(r)
            }
        }

        return res.unique().merge()
    }

    public span(): NzRange {
        if (this.length === 0) {
            return new NzRange(0, 0)
        } else {
            return new NzRange(this[0].begin, this[this.length - 1].end)
        }
    }
}
