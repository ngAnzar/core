
export class Range {
    constructor(public readonly begin: number,
        public readonly end: number) { }

    public merge(r: Range): Range {
        return new Range(
            Math.min(this.begin, r.begin),
            Math.max(this.end, r.end))
    }

    // public extend(r: Range): Range {
    //     (this as any).begin = Math.min(this.begin, r.begin);
    //     (this as any).end = Math.max(this.end, r.end);
    //     return this
    // }

    public isOverlap(other: Range): boolean {
        return Math.max(this.begin, other.begin) < Math.min(this.end, other.end)
    }

    public contains(n: number): boolean {
        return this.begin <= n && this.end >= n
    }

    public copy(): Range {
        return new Range(this.begin, this.end)
    }

    public diff(r: Range): RangeList {
        if (!this.isOverlap(r)) {
            return new RangeList(this, r)
        }

        let res = new RangeList()
        if (this.begin < r.begin) {
            res.push(new Range(this.begin, r.begin))
        } else {
            res.push(new Range(r.begin, this.begin))
        }

        if (this.end < r.end) {
            res.push(new Range(this.end, r.end))
        } else {
            res.push(new Range(r.end, this.end))
        }

        return res.filter(r => r.begin != r.end)
    }

    public isEq(other: Range): boolean {
        return this.begin === other.begin && this.end === other.end
    }

    public shift(amount: number): Range {
        return new Range(this.begin + amount, this.end + amount)
    }
}


export class RangeList extends Array<Range> {
    public push(...ranges: Range[]): number {
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

    public concat(other: RangeList): RangeList {
        let res = new RangeList()
        for (let r of this) {
            res.push(r)
        }
        for (let r of other) {
            res.push(r)
        }
        return res
    }

    public filter(cb: (item: Range, index: number, self: this) => boolean): RangeList {
        return new RangeList(...super.filter(cb))
    }

    public unique(): RangeList {
        return new RangeList(...super.filter((item, i) => super.findIndex(x => x.isEq(item)) === i))
    }

    public sorted(): RangeList {
        return new RangeList(...super.sort((a, b) => a.begin - b.begin))
    }

    public copy() {
        let rl = []
        for (let r of this) {
            rl.push(r.copy())
        }
        return new RangeList(...rl)
    }

    public contains(other: Range | RangeList): boolean {
        if (other instanceof Range) {
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

    public merge(...others: Array<RangeList | Range>): RangeList {
        let flattened = new RangeList(...this)

        for (let o of others) {
            if (o instanceof Range) {
                flattened.push(o)
            } else {
                for (let r of o) {
                    flattened.push(r)
                }
            }
        }

        let result: RangeList = new RangeList()

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

    public diff(other: Range | RangeList): RangeList {
        if (other instanceof Range) {
            other = new RangeList(other)
        }

        let res = new RangeList()
        let sub: { [key: string]: [Range, RangeList] } = {}

        for (let a of this) {
            let k = `${a.begin}-${a.end}`
            let ok = false

            for (let b of other) {
                if (a.isOverlap(b)) {
                    ok = true

                    if (k in sub) {
                        sub[k][1].push(b)
                    } else {
                        sub[k] = [a, new RangeList(b)]
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

    public span(): Range {
        if (this.length === 0) {
            return new Range(0, 0)
        } else {
            return new Range(this[0].begin, this[this.length - 1].end)
        }
    }
}
